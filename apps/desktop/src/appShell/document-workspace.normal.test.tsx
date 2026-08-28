import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { DocumentWorkspace } from "./document-workspace";
import { TabsState } from "./tabs";

type RenderedWorkspace = Readonly<{
  host: HTMLDivElement;
  rerender: (tabsState: TabsState) => void;
  unmount: () => void;
}>;

const rendered: RenderedWorkspace[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

/**
 * DocumentWorkspace を描画してホスト要素を返す。
 *
 * @param tabsState 表示するタブ状態。
 * @returns 描画先と再描画。
 */
const renderWorkspace = (
  tabsState: TabsState,
): Pick<RenderedWorkspace, "host" | "rerender"> => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  const rerender = (next: TabsState): void => {
    act(() => {
      root.render(<DocumentWorkspace tabsState={next} />);
    });
  };

  rerender(tabsState);

  rendered.push({
    host,
    rerender,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  });
  return { host, rerender };
};

/**
 * 指定した aria-label のボタンを返す。
 *
 * @param host 描画先。
 * @param name ボタンの名前。
 * @returns 該当するボタン。無ければ空のボタン。
 */
const buttonNamed = (host: HTMLDivElement, name: string): HTMLButtonElement => {
  const found = Array.from(host.querySelectorAll("button")).find(
    (element) =>
      element.getAttribute("aria-label") === name || element.textContent === name,
  );
  return found instanceof HTMLButtonElement
    ? found
    : document.createElement("button");
};

test("キャンバス文書が前面のとき8種の付箋ボタンとズーム表示がある", () => {
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host } = renderWorkspace(tabsState);
  const captions = [
    "Domain Event",
    "Command",
    "Actor",
    "Aggregate",
    "Policy",
    "Read Model",
    "External System",
    "Hotspot",
  ];

  expect(
    captions.map((caption) =>
      Array.from(host.querySelectorAll("button")).some(
        (button) => button.getAttribute("aria-label") === caption,
      )
        ? caption
        : "",
    ),
  ).toEqual(captions);
  expect(host.querySelector('[aria-label="ズーム 100%"]')?.textContent).toBe(
    "100%",
  );
  expect(host.querySelector('[role="status"]')?.textContent).toBe("保存済み");
});

test("モデル文書が前面のときはキャンバスツールバーを出さない", () => {
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(tabsState);

  expect(host.querySelector('[aria-label="キャンバスツール"]')).toBeNull();
  expect(host.querySelector(".document-workspace__message")?.textContent).toBe(
    "ドメインモデル · order.dmodel",
  );
});

test("キャンバス文書を切り替えると種別の選択は文書ごとに初期状態に戻る", () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const bothOpen = TabsState.reducer(first, {
    type: "openTab",
    path: "/documents/stock.dcanvas",
    documentType: "canvas",
  });
  const orderActive = TabsState.reducer(bothOpen, {
    type: "activateTab",
    path: "/documents/order.dcanvas",
  });
  const { host, rerender } = renderWorkspace(orderActive);

  act(() => {
    buttonNamed(host, "Command").click();
  });
  expect(buttonNamed(host, "Command").getAttribute("aria-pressed")).toBe("true");

  rerender(bothOpen);

  expect(buttonNamed(host, "Domain Event").getAttribute("aria-pressed")).toBe(
    "true",
  );
  expect(buttonNamed(host, "Command").getAttribute("aria-pressed")).toBe(
    "false",
  );
});
