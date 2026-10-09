import { afterEach, expect, test } from "vitest";
import { createStateMachineRenderer } from "./stateMachine.test-support";

const screens = createStateMachineRenderer();

afterEach(() => screens.unmountAll());

test.each([
  { appearance: "normal", initial: "", terminal: "", outlines: 1, starts: 0 },
  {
    appearance: "initial",
    initial: "  initial: 待機\n",
    terminal: "",
    outlines: 1,
    starts: 1,
  },
  {
    appearance: "terminal",
    initial: "",
    terminal: " terminal",
    outlines: 2,
    starts: 0,
  },
  {
    appearance: "initial-terminal",
    initial: "  initial: 待機\n",
    terminal: " terminal",
    outlines: 2,
    starts: 1,
  },
])("$appearance の記号は未選択でも区別できる", ({
  appearance,
  initial,
  terminal,
  outlines,
  starts,
}) => {
  const screen = screens.render(
    `state-machine 注文 =\n${initial}  state: 待機${terminal}`,
  );
  const node = screen.host.querySelector(`[aria-label="待機 ${appearance}"]`)!;

  expect(node.getAttribute("data-selected")).toBe("false");
  expect(node.querySelectorAll("rect")).toHaveLength(outlines);
  expect(node.querySelectorAll("circle")).toHaveLength(starts);
  expect(node.textContent).toBe("待機");
});

test("初期・終端の記号を残したまま選択を切り替える", () => {
  const screen = screens.render(
    "state-machine 注文 =\n  initial: 待機\n  state: 待機\n  state: 完了 terminal",
  );
  const initial = screen.host.querySelector('[aria-label="待機 initial"]')!;
  const terminal = screen.host.querySelector('[aria-label="完了 terminal"]')!;

  screen.selectNode("待機");

  expect(initial.getAttribute("data-selected")).toBe("true");
  expect(terminal.getAttribute("data-selected")).toBe("false");

  screen.selectNode("完了");

  expect(initial.getAttribute("data-selected")).toBe("false");
  expect(terminal.getAttribute("data-selected")).toBe("true");
  expect(initial.querySelector("circle")).not.toBeNull();
  expect(terminal.querySelectorAll("rect")).toHaveLength(2);
});

test("開始記号を初期状態の左に置き、矢印を状態へ向ける", () => {
  const screen = screens.render(
    "state-machine 注文 =\n  initial: 待機\n  state: 待機",
  );
  const node = screen.host.querySelector('[aria-label="待機 initial"]')!;
  const marker = node.querySelector("svg")!;
  const outline = node.querySelector("rect")!;

  expect(
    Number(marker.getAttribute("x")) + Number(marker.getAttribute("width")),
  ).toBe(Number(outline.getAttribute("x")));
  expect(marker.querySelector("circle")).not.toBeNull();
  expect(marker.querySelector("path")).not.toBeNull();
});

test("図の外側に初期・終端・未解決・エラーの凡例を表示する", () => {
  const screen = screens.render("state-machine 注文 =\n  state: 待機");
  const legend = screen.host.querySelector('[aria-label="状態遷移図の凡例"]')!;

  expect(
    [...legend.querySelectorAll("li")].map((item) => item.textContent),
  ).toEqual(["初期", "終端", "未解決", "エラー"]);
  expect(legend.closest('svg[aria-label="注文 の状態遷移図"]')).toBeNull();
  expect(screen.host.querySelectorAll('[role="button"]')).toHaveLength(1);
});
