import { act } from "react";
import { expect, test } from "vitest";
import type { SourceRange } from "@domain-modeler/model-core";
import { DependencyReferences } from "..";
import {
  renderDependency,
  renderContent,
} from "../../__tests__/dependencyView.test-support";

test("参照先を選ぶと図の対象ノードへ選択とフォーカスが移る", () => {
  const screen = renderDependency("data 注文 = 商品\ndata 商品 = string\n");
  const nodes = screen.host.querySelectorAll<HTMLElement>("[data-node-id]");

  act(() => nodes[0].click());
  act(() =>
    screen.host
      .querySelector<HTMLButtonElement>('section[aria-label="依存先"] button')!
      .click(),
  );

  expect(nodes[1].getAttribute("aria-pressed")).toBe("true");
  expect(nodes[0].getAttribute("aria-pressed")).toBe("false");
  expect(document.activeElement).toBe(nodes[1]);
  screen.unmount();
});

test("複数役割の参照を個別の実DSL範囲へ移動できる", () => {
  const opened: (SourceRange | undefined)[] = [];
  const screen = renderDependency(
    "data 注文 = string\nworkflow 更新 =\n  input: 注文\n  output: 注文\n  error: 注文\n",
    { onEditSource: (range) => opened.push(range) },
  );

  act(() =>
    screen.host
      .querySelector<HTMLElement>('[data-kind="WORKFLOW"][role="button"]')!
      .click(),
  );
  const links = screen.host.querySelectorAll<HTMLButtonElement>(
    'section[aria-label="依存先"] ul ul button',
  );
  act(() => links.forEach((link) => link.click()));

  expect(links).toHaveLength(3);
  expect(
    opened.map((range) => [
      range!.startLine,
      range!.startColumn,
      range!.endColumn,
    ]),
  ).toEqual([
    [3, 10, 12],
    [4, 11, 13],
    [5, 10, 12],
  ]);
  screen.unmount();
});

test("接続のない方向にはなしを表示する", () => {
  const screen = renderDependency("data 注文 = string\n");

  act(() => screen.host.querySelector<HTMLElement>("[data-node-id]")!.click());

  expect(
    screen.host.querySelector('section[aria-label="依存先"]')!.textContent,
  ).toBe("依存先なし");
  expect(
    screen.host.querySelector('section[aria-label="参照元"]')!.textContent,
  ).toBe("参照元なし");
  screen.unmount();
});

test("Rootの外では参照一覧を表示しない", () => {
  const screen = renderContent(
    <DependencyReferences title="依存先" relations={[]} />,
  );

  expect(screen.host.textContent).toBe("");
  screen.unmount();
});
