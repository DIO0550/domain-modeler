import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createStateMachineRenderer } from "./stateMachine.test-support";
import { inlineScreen } from "./stateMachineInline.test-support";

const screens = createStateMachineRenderer();

afterEach(() => screens.unmountAll());

test("移動後のclick・dblclickと続く2回目クリックでは編集せず、新しいダブルクリックなら編集できる", () => {
  const screen = inlineScreen(screens);
  const node = screen.node("待機");

  screen.canvas.pointer("pointerdown", { x: 500, y: 440 }, node);
  screen.canvas.pointer("pointermove", { x: 700, y: 640 });
  screen.canvas.pointer("pointerup", { x: 700, y: 640 });
  act(() => {
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    node.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, detail: 2 }),
    );
  });

  expect(screen.input()).toBeNull();

  screen.click(node, 2);
  act(() =>
    node.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, detail: 2 }),
    ),
  );

  expect(screen.input()).toBeNull();

  screen.doubleClick(node);

  expect(screen.input()?.value).toBe("待機");
  expect(screen.changes()).toHaveLength(1);
});

test.each([
  "Escape",
  "pointercancel",
  "lostpointercapture",
])("%s後のdblclickは編集を起動せず、次の通常ダブルクリックで再開できる", (reason) => {
  const screen = inlineScreen(screens);
  const node = screen.node("待機");

  screen.canvas.pointer("pointerdown", { x: 500, y: 440 }, node);
  screen.canvas.pointer("pointermove", { x: 700, y: 640 });

  const cancel =
    reason === "Escape"
      ? screen.canvas.escape
      : () => screen.canvas.pointer(reason, { x: 700, y: 640 });

  cancel();
  screen.canvas.pointer("pointerup", { x: 700, y: 640 });
  act(() => {
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    node.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, detail: 2 }),
    );
  });

  expect(screen.input()).toBeNull();

  screen.doubleClick(node);

  expect(screen.input()?.value).toBe("待機");
});

test("接続ドロップ後のclick/dblclickで新しいイベント入力を既存の名前編集へ置き換えない", () => {
  const screen = inlineScreen(screens);

  screen.selectNode("待機");

  const handle = screen.host.querySelector(
    '[aria-label="待機 から接続 right"]',
  )!;

  screen.canvas.pointer("pointerdown", { x: 660, y: 440 }, handle);
  screen.canvas.pointer("pointerup", { x: 1000, y: 440 });

  const input = screen.input();

  expect(input?.getAttribute("aria-label")).toBe("新しい遷移のイベント名");

  act(() => {
    screen
      .node("完了")
      .dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    screen
      .node("完了")
      .dispatchEvent(new MouseEvent("dblclick", { bubbles: true, detail: 2 }));
  });

  expect(screen.input()).toBe(input);

  screen.enterName("再確定");
  screen.confirm();
  act(() =>
    screen
      .edge("再確定")
      .dispatchEvent(new MouseEvent("dblclick", { bubbles: true, detail: 2 })),
  );

  expect(screen.input()).toBeNull();

  screen.editEvent("再確定");

  expect(screen.input()?.value).toBe("再確定");
});

test("接続取消後のclick/dblclickで名前編集を起動しない", () => {
  const screen = inlineScreen(screens);

  screen.selectNode("待機");
  screen.canvas.pointer(
    "pointerdown",
    { x: 660, y: 440 },
    screen.host.querySelector('[aria-label="待機 から接続 right"]')!,
  );
  screen.canvas.pointer("pointerup", { x: 1500, y: 700 });
  act(() => {
    screen
      .node("完了")
      .dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    screen
      .node("完了")
      .dispatchEvent(new MouseEvent("dblclick", { bubbles: true, detail: 2 }));
  });

  expect(screen.input()).toBeNull();

  screen.editState("完了");

  expect(screen.input()?.value).toBe("完了");
});

test("4px未満の手ぶれを含むダブルクリックは名前編集を開く", () => {
  const screen = inlineScreen(screens);
  const node = screen.node("待機");

  screen.canvas.pointer("pointerdown", { x: 500, y: 440 }, node);
  screen.canvas.pointer("pointerup", { x: 503, y: 440 });
  act(() =>
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 })),
  );
  screen.click(node, 2);
  act(() =>
    node.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, detail: 2 }),
    ),
  );

  expect(screen.input()?.value).toBe("待機");
  expect(screen.changes()).toHaveLength(0);
});
