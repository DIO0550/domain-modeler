import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createStateMachineRenderer } from "./stateMachine.test-support";
import { connectionScreen, connectionSource as source } from "./stateMachineConnection.test-support";

const screens = createStateMachineRenderer();
afterEach(() => screens.unmountAll());

test("選択した非終端状態の四辺にだけ接続ハンドルを表示する", () => {
  const screen = screens.render(source);
  expect(screen.host.querySelectorAll(".state-machine-screen__connection-handle")).toHaveLength(0);
  screen.selectNode("待機");
  expect(screen.host.querySelectorAll(".state-machine-screen__connection-handle")).toHaveLength(4);
  screen.selectNode("完了");
  expect(screen.host.querySelectorAll(".state-machine-screen__connection-handle")).toHaveLength(0);
});

test("候補を強調し、イベント確定で1件だけ追加して座標を保持する", () => {
  const screen = connectionScreen(screens);
  screen.begin();
  screen.canvas.pointer("pointermove", { x: 1000, y: 440 });
  expect(screen.host.querySelector('[aria-label="完了 terminal"]')!.getAttribute("data-connection-candidate")).toBe("true");
  expect(screen.host.querySelector(".state-machine-screen__connection-preview")!.getAttribute("d")).toBe("M 280 200 L 420 200");
  expect(screen.source()).toBe(source);
  screen.drop();
  screen.canvas.pointer("lostpointercapture", { x: 0, y: 0 });
  expect(document.activeElement?.getAttribute("aria-label")).toBe("新しい遷移のイベント名");
  screen.enterConnectionEvent("確定");
  screen.submitEvent();
  expect(screen.source()).toBe(`${source}\n  transition: 待機 -> 完了 on 確定`);
  expect(screen.changes()).toHaveLength(1);
  expect(screen.host.querySelector(".state-machine-screen__label-editor")).toBeNull();
  expect(document.activeElement).toBe(screen.canvas.svg);
});

test("自己ループを作成でき、空のイベント名は確定しない", () => {
  const screen = connectionScreen(screens);
  screen.begin();
  screen.canvas.pointer("pointermove", { x: 750, y: 300 });
  screen.canvas.pointer("pointerup", { x: 500, y: 440 });
  screen.submitEvent();
  expect(screen.host.querySelector('[role="alert"]')?.textContent).toContain("イベント名");
  expect(screen.source()).toBe(source);
  screen.enterConnectionEvent("再試行");
  screen.submitEvent();
  expect(screen.source()).toContain("transition: 待機 -> 待機 on 再試行");
});

test.each(["blank", "escape", "pointercancel", "lostpointercapture"])("%sで取消後のclick・dblclick・通常クリックでは状態を誤配置しない", (reason) => {
  const screen = connectionScreen(screens);
  screen.begin();
  screen.canvas.pointer("pointermove", { x: 1500, y: 700 });
  screen.cancel(reason);
  screen.canvas.pointer("pointerup", { x: 1500, y: 700 });
  act(() => {
    screen.canvas.svg.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    screen.canvas.svg.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  });
  screen.canvas.click({ x: 1500, y: 700 });
  expect(screen.source()).toBe(source);
  expect(screen.host.querySelector(".state-machine-screen__label-editor")).toBeNull();
  screen.openState();
  screen.canvas.click({ x: 1500, y: 700 });
  expect(screen.source()).toContain("state: 状態1");
});

test("入力欄のEscapeは未確定の接続を破棄してグラフにフォーカスを戻す", () => {
  const screen = connectionScreen(screens);
  screen.begin();
  screen.drop();
  screen.enterConnectionEvent("下書き");
  act(() => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(screen.source()).toBe(source);
  expect(screen.host.querySelector(".state-machine-screen__label-editor")).toBeNull();
  expect(document.activeElement).toBe(screen.canvas.svg);
});

test("イベント入力中に文書が外部更新されたら古い接続を確定しない", () => {
  const screen = connectionScreen(screens);
  screen.begin();
  screen.drop();
  screen.enterConnectionEvent("下書き");
  const changed = source.replace("完了", "終了");
  screen.replaceSource(changed);
  expect(screen.host.querySelector(".state-machine-screen__label-editor")).toBeNull();
  expect(screen.source()).toBe(changed);
});

test("候補上を通っても空白へ離せば接続しない", () => {
  const screen = connectionScreen(screens);
  screen.begin();
  screen.canvas.pointer("pointermove", { x: 1000, y: 440 });
  screen.canvas.pointer("pointerup", { x: 1500, y: 700 });
  expect(screen.host.querySelector(".state-machine-screen__label-editor")).toBeNull();
  expect(screen.source()).toBe(source);
});

test("入力の取消ボタンは文書を変えず、マシン切替でも下書きを持ち越さない", () => {
  const screen = connectionScreen(screens, `${source}\nstate-machine 返金 =\n  state: 待機`);
  screen.begin();
  screen.drop();
  act(() => [...screen.host.querySelectorAll<HTMLButtonElement>(".state-machine-screen__label-editor button")].find((button) => button.textContent === "取消")!.click());
  expect(screen.changes()).toHaveLength(0);
  screen.begin();
  screen.drop();
  const picker = screen.host.querySelector<HTMLSelectElement>(".state-machine-screen__toolbar select")!;
  screen.changeSelect(picker, "1");
  screen.changeSelect(picker, "0");
  expect(screen.host.querySelector(".state-machine-screen__label-editor")).toBeNull();
  expect(screen.changes()).toHaveLength(0);
});

test("ドラッグ中に文書が変わると候補を消し、古い接続を確定しない", () => {
  const screen = connectionScreen(screens);
  screen.begin();
  screen.canvas.pointer("pointermove", { x: 1000, y: 440 });
  const external = `${source}\n  state: 追加`;
  screen.replaceSource(external);
  expect(screen.host.querySelector(".state-machine-screen__connection-preview")).toBeNull();
  screen.drop();
  expect(screen.host.querySelector(".state-machine-screen__label-editor")).toBeNull();
  expect(screen.source()).toBe(external);
});

test("未定義参照と重複宣言からは接続を開始できない", () => {
  const screen = screens.render(`${source}\n  state: 待機\n  transition: 待機 -> 未定義 on 失敗`);
  screen.selectNode("待機");
  expect(screen.host.querySelectorAll(".state-machine-screen__connection-handle")).toHaveLength(0);
  screen.selectNode("未定義");
  expect(screen.host.querySelectorAll(".state-machine-screen__connection-handle")).toHaveLength(0);
});

test("重なった状態では最前面の候補が確定先になる", () => {
  const screen = connectionScreen(screens, `${source}\n  state: 最前面 // @canvas-position(v1, 500, 200)`);
  screen.begin();
  screen.canvas.pointer("pointermove", { x: 1000, y: 440 });
  expect(screen.host.querySelector('[data-connection-candidate="true"]')?.getAttribute("aria-label")).toBe("最前面 normal");
  screen.drop();
  screen.enterConnectionEvent("確定");
  screen.submitEvent();
  expect(screen.source()).toContain("transition: 待機 -> 最前面 on 確定");
});

test("IME変換中のEnter・Escapeでは接続を確定・取消しない", () => {
  const screen = connectionScreen(screens);
  screen.begin();
  screen.drop();
  screen.enterConnectionEvent("確定");
  const input = document.activeElement!;
  const enter = new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true });
  act(() => input.dispatchEvent(enter));
  act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", isComposing: true, bubbles: true })));
  expect(enter.defaultPrevented).toBe(true);
  expect(screen.source()).toBe(source);
  expect(document.activeElement).toBe(input);
  screen.submitEvent();
  expect(screen.source()).toContain("transition: 待機 -> 完了 on 確定");
});

test("未定義参照のノードへドロップしても入力を開かない", () => {
  const screen = connectionScreen(screens, `${source}\n  transition: 待機 -> 未定義 on 失敗`);
  screen.begin();
  // 保存位置のない未定義ノードは既存状態の右側(x=760,y=100)へ導出配置される。
  screen.canvas.pointer("pointerup", { x: 1620, y: 240 });
  expect(screen.host.querySelector(".state-machine-screen__label-editor")).toBeNull();
  expect(screen.changes()).toHaveLength(0);
});

test("配置待ちへの切替で接続下書きを破棄し、新しく選んだ状態を1個だけ置く", () => {
  const screen = connectionScreen(screens);
  screen.begin();
  screen.drop();
  screen.enterConnectionEvent("破棄するイベント");
  screen.openState();
  expect(screen.host.querySelector(".state-machine-screen__label-editor")).toBeNull();
  screen.canvas.click({ x: 1500, y: 700 });
  expect(screen.source()).toContain("state: 状態1");
  expect(screen.source()).not.toContain("破棄するイベント");
  screen.canvas.click({ x: 1500, y: 700 });
  expect(screen.changes()).toHaveLength(1);
});

test("ハンドル中心からずれて押しても候補は実ポインター位置で判定する", () => {
  const screen = connectionScreen(screens);
  screen.canvas.pointer("pointerdown", { x: 670, y: 440 }, screen.host.querySelector('[aria-label="待機 から接続 right"]')!);
  // 完了ノードの右端(x=580)より外へ離す。開始位置のずれで内側へ吸着させない。
  screen.canvas.pointer("pointerup", { x: 1262, y: 440 });
  expect(screen.host.querySelector(".state-machine-screen__label-editor")).toBeNull();
  expect(screen.changes()).toHaveLength(0);
});
