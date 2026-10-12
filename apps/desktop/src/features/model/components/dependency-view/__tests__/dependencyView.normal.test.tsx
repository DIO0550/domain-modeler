import { act } from "react";
import { test, expect } from "vitest";
import { renderDependency } from "./dependencyView.test-support";

test("workflowの各役割を文字で区別し、入力もworkflowから参照先へ向く", () => {
  const screen = renderDependency(`data 注文 = string
workflow 更新する =
  input: 注文
  output: 注文
  error: 注文
`);
  const workflow = screen.host.querySelector<HTMLElement>(
    '[data-kind="WORKFLOW"][role="button"]',
  )!;

  act(() => workflow.click());

  const inspector = screen.host.querySelector("aside")!;
  const edge = screen.host.querySelector("svg g")!;

  expect(inspector.textContent).toContain("入力");
  expect(inspector.textContent).toContain("出力");
  expect(inspector.textContent).toContain("エラー");
  expect(edge.getAttribute("data-from")).toBe(workflow.dataset.nodeId);
  expect(edge.getAttribute("aria-label")).toBe(
    "更新する → 注文: 入力・出力・エラー",
  );
  expect(edge.querySelectorAll("text tspan")).toHaveLength(3);
  expect(screen.host.querySelectorAll("svg g")).toHaveLength(1);
  screen.unmount();
});

test("カードの種類、ANDとOR、修飾順、長さ・範囲制約を省略しない", () => {
  const screen = renderDependency(`data 名前 = string constrained length 1..80
data 数量 = int constrained 1..100
data 項目 = 名前 list option AND 数量 option list
data 結果 = 項目 OR 名前
data 別名 = 結果
`);
  const nodes = [
    ...screen.host.querySelectorAll<HTMLElement>("[role=button][data-node-id]"),
  ];

  expect(nodes.map((node) => node.dataset.kind)).toEqual([
    "VALUE",
    "VALUE",
    "RECORD",
    "CHOICE",
    "ALIAS",
  ]);
  expect(nodes[0].textContent).toContain("長さ1..80");
  expect(nodes[1].textContent).toContain("範囲1..100");
  expect(nodes[2].textContent).toContain(
    "AND名前 list optionAND数量 option list",
  );
  expect(nodes[3].textContent).toContain("OR項目OR名前");
  screen.unmount();
});

test("カードをキーボードで選択し、空白で解除できる", () => {
  const screen = renderDependency("data 注文 = string\n");
  const node = screen.host.querySelector<HTMLElement>(
    "[role=button][data-node-id]",
  )!;

  act(() =>
    node.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    ),
  );

  expect(node.getAttribute("aria-pressed")).toBe("true");
  expect(screen.host.querySelector("aside")!.textContent).toContain("ALIAS");

  act(() =>
    screen.host
      .querySelector<HTMLElement>(".dependency-view__drawing")!
      .click(),
  );

  expect(node.getAttribute("aria-pressed")).toBe("false");
  screen.unmount();
});

test("孤立した宣言と循環・自己参照を表示する", () => {
  const screen = renderDependency(
    "data 木 = 木 list\ndata A = B\ndata B = A\ndata 孤立 = string\n",
  );

  expect(
    screen.host.querySelectorAll("[role=button][data-node-id]"),
  ).toHaveLength(4);
  expect(screen.host.querySelectorAll("svg g")).toHaveLength(3);
  expect(screen.host.querySelector("[role=alert]")).toBeNull();
  screen.unmount();
});

test("エラー未指定のworkflowは入力と出力だけを表示し、プリミティブの専用ノードを作らない", () => {
  const screen = renderDependency(
    "workflow 変換する =\n  input: string\n  output: int\n",
  );
  const workflow = screen.host.querySelector<HTMLElement>(
    '[data-kind="WORKFLOW"][role="button"]',
  )!;

  expect(workflow.textContent).toContain("入力string出力int");
  expect(workflow.textContent).not.toContain("エラー");
  expect(screen.host.querySelectorAll("[data-node-id]")).toHaveLength(1);
  expect(screen.host.querySelectorAll("svg g")).toHaveLength(0);
  screen.unmount();
});
