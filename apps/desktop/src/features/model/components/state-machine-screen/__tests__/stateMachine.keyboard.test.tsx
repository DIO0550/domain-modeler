import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createStateMachineRenderer } from "./stateMachine.test-support";

const screens = createStateMachineRenderer();
afterEach(() => screens.unmountAll());

const source = `state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定`;

test.each([
  'select[aria-label="遷移元"]',
  'select[aria-label="遷移先"]',
  'input[aria-label="イベント名"]',
  ".state-machine-screen__toolbar select",
])("%s にフォーカスしてEscapeを押しても、選択中の遷移と下書きを保持して確定できる", (selector) => {
  const screen = screens.render(source);
  screen.selectNode("待機");
  screen.clickInspectorButton("確定→ 完了");
  screen.enterEvent("変更中");
  screen.changeSelect(screen.select("遷移先"), "待機");
  const control = screen.host.querySelector<HTMLElement>(selector)!;
  control.focus();
  act(() => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", {
    key: "Escape", bubbles: true, cancelable: true,
  })));

  expect(document.activeElement).toBe(control);
  expect(screen.host.querySelector('.state-machine-screen__edge[data-selected="true"]')).not.toBeNull();
  expect(screen.host.querySelector<HTMLInputElement>('input[aria-label="イベント名"]')?.value).toBe("変更中");
  expect(screen.select("遷移先").value).toBe("待機");
  expect(screen.source()).toBe(source);
  screen.submit();
  expect(screen.source()).toContain("transition: 待機 -> 待機 on 変更中");
});

test("遷移追加フォームの選択欄でEscapeを押しても追加モードと下書きを保持する", () => {
  const screen = screens.render(source);
  screen.openTransition();
  screen.enterEvent("再試行");
  const control = screen.select("遷移先");
  screen.changeSelect(control, "待機");
  control.focus();
  act(() => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));

  expect(document.activeElement).toBe(control);
  expect(screen.host.querySelector<HTMLInputElement>('input[aria-label="イベント名"]')?.value).toBe("再試行");
  expect(screen.source()).toBe(source);
  screen.submit();
  expect(screen.source()).toContain("transition: 待機 -> 待機 on 再試行");
});

test("グラフにフォーカスしてEscapeを押すと選択を解除する", () => {
  const screen = screens.render(source);
  screen.selectNode("待機");
  const graph = screen.host.querySelector<SVGSVGElement>("svg.state-machine-screen__graph")!;
  graph.focus();
  act(() => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));

  expect(screen.host.querySelector('[data-selected="true"]')).toBeNull();
  expect(screen.host.querySelector('input[aria-label="状態名"]')).toBeNull();
  expect(screen.source()).toBe(source);
});
