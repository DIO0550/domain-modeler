import { act } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { canvasPointer, createStateMachineRenderer } from "./stateMachine.test-support";
import { inlineScreen, inlineSource } from "./stateMachineInline.test-support";

const screens = createStateMachineRenderer();
afterEach(() => {
  screens.unmountAll();
  vi.useRealTimers();
});

test.each(["Delete", "Backspace"])("%sで選択した初期状態と接続遷移を1回で削除し、グラフへフォーカスを残す", (key) => {
  const other = "\nstate-machine 返金 =\n  state: 待機";
  const screen = screens.render(inlineSource + other);
  screen.selectNode("待機");
  screen.host.querySelector<SVGGElement>('[aria-label="待機 initial"]')!.focus();
  const event = screen.key(key);

  expect(event.defaultPrevented).toBe(true);
  expect(screen.source()).toBe("state-machine 注文 =\n  state: 完了 terminal // @canvas-position(v1, 500, 200)" + other);
  expect(screen.changes()).toHaveLength(1);
  expect(screen.host.querySelector('[data-selected="true"]')).toBeNull();
  expect(document.activeElement).toBe(screen.host.querySelector("svg.state-machine-screen__graph"));
  screen.key(key, { repeat: true });
  expect(screen.changes()).toHaveLength(1);
});

test("Backspaceでキーボード選択した遷移だけを削除し、状態と座標を保つ", () => {
  const screen = screens.render(inlineSource + "\n  transition: 待機 -> 待機 on 再試行");
  const edge = screen.host.querySelector<SVGGElement>('[aria-label="待機 から 完了 へ、確定"]')!;
  edge.focus();
  screen.key(" ");
  expect(edge.getAttribute("data-selected")).toBe("true");
  screen.key("Backspace");

  expect(screen.source()).toBe(inlineSource.replace("\n  transition: 待機 -> 完了 on 確定 // 遷移コメント", "") + "\n  transition: 待機 -> 待機 on 再試行");
  expect(screen.changes()).toHaveLength(1);
  expect(document.activeElement).toBe(screen.host.querySelector("svg.state-machine-screen__graph"));
});

test("最後の状態を削除しても空のグラフをフォーカスし、入力を続けられる", () => {
  const screen = screens.render("state-machine 注文 =\n  state: 待機");
  screen.selectNode("待機");
  const graph = screen.host.querySelector<SVGSVGElement>("svg.state-machine-screen__graph")!;
  graph.focus();
  screen.key("Delete");
  expect(screen.source()).toBe("state-machine 注文 =\n");
  expect(document.activeElement).toBe(graph);
  screen.key("Backspace");
  expect(screen.changes()).toHaveLength(1);
});

test.each([
  'input[aria-label="イベント名"]',
  'select[aria-label="遷移元"]',
  'select[aria-label="遷移先"]',
  ".state-machine-screen__toolbar select",
])("%sでDeleteとBackspaceを押しても文書・選択・下書きを変更しない", (selector) => {
  const screen = screens.render(inlineSource);
  screen.selectNode("待機");
  screen.clickInspectorButton("確定→ 完了");
  screen.enterEvent("編集中");
  const control = screen.host.querySelector<HTMLElement>(selector)!;
  control.focus();
  expect(screen.key("Delete").defaultPrevented).toBe(false);
  expect(screen.key("Backspace").defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(control);
  expect(screen.source()).toBe(inlineSource);
  expect(screen.host.querySelector('.state-machine-screen__edge[data-selected="true"]')).not.toBeNull();
  expect(screen.host.querySelector<HTMLInputElement>('input[aria-label="イベント名"]')?.value).toBe("編集中");
});

test("右プロパティの削除ボタン上のDeleteでは削除せず、クリックで削除できる", async () => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  const screen = screens.render(inlineSource);
  screen.selectNode("待機");
  const button = [...screen.host.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "削除")!;
  button.focus();
  expect(screen.key("Delete").defaultPrevented).toBe(false);
  expect(screen.source()).toBe(inlineSource);
  act(() => button.click());
  await act(async () => vi.advanceTimersByTimeAsync(20));
  expect(document.activeElement).toBe(screen.host.querySelector("svg.state-machine-screen__graph"));
  expect(screen.source()).not.toContain("待機");
});

test.each([
  { isComposing: true }, { ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true },
])("IME変換中や修飾キー付きDeleteは削除操作として扱わない: %j", (options) => {
  const screen = screens.render(inlineSource);
  screen.selectNode("待機");
  screen.host.querySelector<SVGSVGElement>("svg.state-machine-screen__graph")!.focus();
  expect(screen.key("Delete", options).defaultPrevented).toBe(false);
  expect(screen.source()).toBe(inlineSource);
});

test.each(["未定義", "重複"])("%s状態は削除せず、エラーと選択を保つ", (name) => {
  const source = "state-machine 注文 =\n  state: 重複\n  state: 重複\n  transition: 重複 -> 未定義 on 確定";
  const screen = screens.render(source);
  screen.selectNode(name);
  screen.host.querySelector<SVGSVGElement>("svg.state-machine-screen__graph")!.focus();
  screen.key("Delete");
  expect(screen.source()).toBe(source);
  expect(screen.changes()).toEqual([]);
  expect(screen.host.querySelector('[data-selected="true"]')).not.toBeNull();
  expect(screen.host.querySelector('[role="alert"]')?.textContent).toContain("削除する状態を一意に特定できません");
});

test("外部変更で選択対象が消えても別の状態を削除しない", () => {
  const screen = screens.render(inlineSource);
  screen.selectNode("待機");
  const changed = "state-machine 注文 =\n  state: 保留";
  screen.replaceSource(changed);
  screen.host.querySelector<SVGSVGElement>("svg.state-machine-screen__graph")!.focus();
  screen.key("Delete");
  expect(screen.source()).toBe(changed);
  expect(screen.changes()).toEqual([changed]);
  expect(screen.host.querySelector('[role="alert"]')?.textContent).toContain("削除する要素を特定できません");
});

test("図上の入力や確定ボタンでDeleteを押しても状態を削除せず下書きを保持する", () => {
  const screen = inlineScreen(screens);
  screen.editState("待機");
  screen.enterName("保留");
  screen.key("Delete");
  screen.host.querySelector<HTMLButtonElement>(".state-machine-screen__label-editor button")!.focus();
  screen.key("Delete");
  expect(screen.source()).toBe(inlineSource);
  expect(screen.input()?.value).toBe("保留");
  screen.confirm();
  expect(screen.source()).toContain("state: 保留");
});

test("状態移動中のDeleteでは削除せず、Escapeで移動と選択を取り消す", () => {
  const screen = screens.render(inlineSource);
  const canvas = canvasPointer(screen.host);
  canvas.pointer("pointerdown", { x: 500, y: 440 }, screen.host.querySelector('[aria-label="待機 initial"]')!);
  canvas.pointer("pointermove", { x: 600, y: 500 });
  screen.key("Delete");
  expect(screen.source()).toBe(inlineSource);
  screen.key("Escape");
  canvas.pointer("pointerup", { x: 600, y: 500 });
  expect(screen.source()).toBe(inlineSource);
  expect(screen.host.querySelector('[data-selected="true"]')).toBeNull();
  expect(document.activeElement).toBe(canvas.svg);
});

test("削除後の遅延フォーカス復帰で別画面へ移したフォーカスを奪わない", async () => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  const screen = screens.render(inlineSource);
  screen.selectNode("待機");
  screen.clickInspectorButton("削除");
  const outside = document.createElement("button");
  screen.host.append(outside);
  outside.focus();
  await act(async () => vi.advanceTimersByTimeAsync(20));
  expect(document.activeElement).toBe(outside);
});

test.each(["textarea", "div", "input"])("グラフ内の%s入力でもDelete・Backspace・Escapeを奪わない", (tag) => {
  const screen = screens.render(inlineSource);
  screen.selectNode("待機");
  const graph = screen.host.querySelector<SVGSVGElement>("svg.state-machine-screen__graph")!;
  const input = document.createElement(tag);
  input.setAttribute("contenteditable", "true");
  input.setAttribute("tabindex", "0");
  graph.append(input);
  input.focus();
  expect(screen.key("Delete").defaultPrevented).toBe(false);
  expect(screen.key("Backspace").defaultPrevented).toBe(false);
  expect(screen.key("Escape").defaultPrevented).toBe(false);
  expect(screen.source()).toBe(inlineSource);
  expect(screen.host.querySelector('[data-selected="true"]')).not.toBeNull();
  expect(document.activeElement).toBe(input);
});
