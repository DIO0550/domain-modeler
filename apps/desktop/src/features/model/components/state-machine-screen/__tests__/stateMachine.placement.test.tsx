import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createStateMachineRenderer, canvasPointer } from "./stateMachine.test-support";

const screens = createStateMachineRenderer();
afterEach(() => screens.unmountAll());
const source = "state-machine 注文 =\n  initial: 待機\n  state: 待機\n  state: 完了 terminal\n  transition: 待機 -> 完了 on 確定";

test("空マシンでもパレットの1回選択につき、クリック位置に1個だけ追加する", () => {
  const screen = screens.render("state-machine 注文 =\n");
  const canvas = canvasPointer(screen.host);
  screen.openState();
  canvas.click({ x: 700, y: 440 });
  expect(screen.source()).toContain("state: 状態1 // @canvas-position(v1, 300, 200)");
  expect(screen.host.querySelectorAll(".state-machine-screen__node")).toHaveLength(1);
  canvas.click({ x: 900, y: 640 });
  expect(screen.host.querySelectorAll(".state-machine-screen__node")).toHaveLength(1);
  expect(screen.changes()).toHaveLength(1);
});

test("ドラッグの一時表示では書き込まず、確定と捕捉解除が続いても履歴を1回だけ更新する", () => {
  const screen = screens.render(source);
  const canvas = canvasPointer(screen.host);
  const node = screen.host.querySelector('[aria-label="待機 initial"]')!;
  const originalPath = screen.host.querySelector(".state-machine-screen__edge-line")!.getAttribute("d");
  const originalX = Number(node.querySelector("rect")!.getAttribute("x"));
  canvas.pointer("pointerdown", { x: 300, y: 240 }, node);
  canvas.pointer("pointermove", { x: 500, y: 440 });
  expect(Number(node.querySelector("rect")!.getAttribute("x"))).toBe(originalX + 100);
  expect(screen.host.querySelector(".state-machine-screen__edge-line")!.getAttribute("d")).not.toBe(originalPath);
  expect(screen.changes()).toHaveLength(0);
  canvas.pointer("pointerup", { x: 500, y: 440 });
  canvas.pointer("lostpointercapture", { x: 0, y: 0 });
  expect(screen.changes()).toHaveLength(1);
  expect(screen.source()).toContain("state: 待機 // @canvas-position(v1, 200, 200)");
});

test("Escapeとpointercancelは移動を取り消し、後続clickで配置しない", () => {
  const screen = screens.render(source);
  const canvas = canvasPointer(screen.host);
  screen.openState();
  const node = screen.host.querySelector('[aria-label="待機 initial"]')!;
  canvas.pointer("pointerdown", { x: 300, y: 240 }, node);
  canvas.pointer("pointermove", { x: 500, y: 440 });
  canvas.escape();
  canvas.pointer("pointerup", { x: 500, y: 440 });
  canvas.click({ x: 700, y: 500 });
  expect(screen.source()).toBe(source);
  canvas.pointer("pointerdown", { x: 300, y: 240 }, node);
  canvas.pointer("pointermove", { x: 500, y: 440 });
  canvas.pointer("pointercancel", { x: 500, y: 440 });
  canvas.pointer("lostpointercapture", { x: 500, y: 440 });
  expect(screen.source()).toBe(source);
});

test("配置待ちの小さな手ぶれはクリック、4px以上は空白ドラッグとして区別する", () => {
  const screen = screens.render(source);
  const canvas = canvasPointer(screen.host);
  screen.openState();
  canvas.pointer("pointerdown", { x: 700, y: 440 });
  canvas.pointer("pointermove", { x: 704, y: 440 });
  canvas.pointer("pointerup", { x: 700, y: 440 });
  expect(screen.source()).toBe(source);
  canvas.pointer("pointerdown", { x: 700, y: 440 });
  canvas.pointer("pointerup", { x: 703, y: 440 });
  expect(screen.source()).toContain("state: 状態1 // @canvas-position(v1, 300, 200)");
});

test("移動中に文書が外部更新されたら古いドラッグ内容を上書きしない", () => {
  const screen = screens.render(source);
  const canvas = canvasPointer(screen.host);
  canvas.pointer("pointerdown", { x: 300, y: 240 }, screen.host.querySelector('[aria-label="待機 initial"]')!);
  canvas.pointer("pointermove", { x: 500, y: 440 });
  const external = source.replace("on 確定", "on 変更");
  screen.replaceSource(external);
  canvas.pointer("pointerup", { x: 500, y: 440 });
  expect(screen.source()).toBe(external);
});

test("捕捉だけが失われた場合は最後の移動位置を保存する", () => {
  const screen = screens.render(source);
  const canvas = canvasPointer(screen.host);
  canvas.pointer("pointerdown", { x: 300, y: 240 }, screen.host.querySelector('[aria-label="待機 initial"]')!);
  canvas.pointer("pointermove", { x: 500, y: 440 });
  canvas.pointer("lostpointercapture", { x: 0, y: 0 });
  expect(screen.source()).toContain("state: 待機 // @canvas-position(v1, 200, 200)");
  expect(screen.changes()).toHaveLength(1);
});

test("配置した文書を再読込しても同じ座標になり、フィットは保存内容を変えない", () => {
  const screen = screens.render(source);
  const canvas = canvasPointer(screen.host);
  screen.openState();
  canvas.click({ x: 700, y: 440 });
  const saved = screen.source();
  const reopened = screens.render(saved);
  const rect = reopened.host.querySelector('[aria-label="状態1 normal"] rect')!;
  expect(rect.getAttribute("x")).toBe("220");
  expect(rect.getAttribute("y")).toBe("168");
  act(() => [...reopened.host.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "フィット")!.click());
  expect(reopened.source()).toBe(saved);
});
