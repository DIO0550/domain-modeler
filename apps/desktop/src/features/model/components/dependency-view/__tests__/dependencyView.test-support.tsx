import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AnalyzedModel } from "../../../domains/analyzed-model";
import type { DiagramSurface } from "@/libs/diagram-surface";
import type { ElementSize } from "@/libs/element-size";
import type { SourceRange } from "@domain-modeler/model-core";
import { DependencyDiagram } from "../../../domains/dependency-diagram";
import { expectLayout } from "../../../domains/model-graph-layout/__tests__/modelGraphLayout.test-support";
import { DependencyView } from "../index";

/** ブラウザの寸法計測境界だけを固定寸法に置き換える。 */
export const fixedSizes: typeof ElementSize.observe = (container, report) => {
  report(
    new Map(
      [...container.querySelectorAll<HTMLElement>("[data-measure-node]")].map(
        (element) => [
          element.dataset.measureNode!,
          { width: 280, height: 180 },
        ],
      ),
    ),
  );

  return () => undefined;
};

/** 最初の計測だけ失敗し、再試行で正常寸法を返すI/O境界。 */
export function createRetrySizes(): typeof ElementSize.observe {
  let attempt = 0;

  return (container, report) => {
    attempt += 1;

    if (attempt === 1) {
      report(new Map());

      return () => undefined;
    }

    return fixedSizes(container, report);
  };
}

export function renderDependency(
  source: string,
  options: Readonly<{
    observeSizes?: typeof ElementSize.observe;
    observeSurface?: typeof DiagramSurface.observe;
    onEditSource?: (range?: SourceRange) => void;
    children?: ReactNode;
  }> = {},
) {
  const host = document.createElement("div");

  document.body.append(host);

  const root = createRoot(host);
  const render = (value: string) => {
    act(() =>
      root.render(
        <DependencyView.Root
          analyzed={AnalyzedModel.create(value)}
          onEditSource={options.onEditSource ?? (() => undefined)}
          observeSizes={options.observeSizes ?? fixedSizes}
          observeSurface={options.observeSurface}
        >
          {options.children ?? (
            <>
              <DependencyView.Legend />
              <DependencyView.Toolbar />
              <DependencyView.Graph />
              <DependencyView.Inspector />
              <DependencyView.Diagnostics />
            </>
          )}
        </DependencyView.Root>,
      ),
    );
  };

  render(source);

  return {
    host,
    render,
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

/** Contextの外の部品や複数の独立したRootを描画する。 */
export function renderContent(content: ReactNode) {
  const host = document.createElement("div");

  document.body.append(host);

  const root = createRoot(host);

  act(() => root.render(content));

  return {
    host,
    render: (next: ReactNode) => act(() => root.render(next)),
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

/** 実DSLの参照関係と、固定したDOM寸法による描画入力を準備する。 */
export function createDependencyLayout(source: string) {
  const diagram = DependencyDiagram.create(AnalyzedModel.create(source));
  const sizes = new Map(
    diagram.graph.nodes.map((node) => [node.id, { width: 280, height: 180 }]),
  );
  const layout = expectLayout({ graph: diagram.graph, sizes });

  return { diagram, layout };
}

/** 計測の完了前を維持するDOM境界。 */
export const waitingSizes: typeof ElementSize.observe = () => () => undefined;

/** 表示範囲の切替ボタンを表示名で取得する。 */
export function scopeButton(host: HTMLElement, name: "全体" | "関連のみ") {
  return [
    ...host.querySelectorAll<HTMLButtonElement>(
      '[aria-label="依存図の表示範囲"] button',
    ),
  ].find((button) => button.textContent === name)!;
}

/** 計測用カードを除いた表示中のモデルカードを取得する。 */
export function modelNode(host: HTMLElement, name: string) {
  return [...host.querySelectorAll<HTMLElement>("[data-node-id]")].find(
    (node) =>
      node.querySelector(".dependency-view__name")!.textContent === name,
  )!;
}

/** 実際に表示されるカード名を順番に取得する。 */
export function visibleNames(host: HTMLElement) {
  return [
    ...host.querySelectorAll("[data-node-id] .dependency-view__name"),
  ].map((node) => node.textContent);
}

/** 表示されている辺のラベルと経路を取得する。 */
export function visibleRoutes(host: HTMLElement) {
  return [...host.querySelectorAll<SVGGElement>("svg g")].map((edge) => ({
    label: edge.getAttribute("aria-label"),
    path: edge.querySelector("path")!.getAttribute("d"),
  }));
}

/** 画面寸法だけを固定するDOM計測境界。 */
export const fixedSurface: typeof DiagramSurface.observe = (
  _element,
  report,
) => {
  report({ width: 900, height: 600 });

  return () => undefined;
};

/** 表示名または読み上げ名で図の操作ボタンを取得する。 */
export function diagramButton(host: HTMLElement, name: string) {
  return [
    ...host.querySelectorAll<HTMLButtonElement>(
      ".dependency-view__toolbar button",
    ),
  ].find(
    (button) =>
      (button.getAttribute("aria-label") ?? button.textContent) === name,
  )!;
}

/** 実際に描画された図の変換を読む。 */
export function drawingTransform(host: HTMLElement) {
  return host.querySelector<HTMLElement>(".dependency-view__drawing")!.style
    .transform;
}

/** happy-domが省略するwheelの修飾キーだけを補って通知する。 */
export function diagramWheel(element: Element, options: WheelEventInit) {
  const event = new WheelEvent("wheel", {
    bubbles: true,
    cancelable: true,
    ...options,
  });

  Object.defineProperties(event, {
    ctrlKey: { value: options.ctrlKey ?? false },
    metaKey: { value: options.metaKey ?? false },
    clientX: { value: options.clientX ?? 0 },
    clientY: { value: options.clientY ?? 0 },
  });
  act(() => element.dispatchEvent(event));

  return event;
}
