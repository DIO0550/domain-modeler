import { act } from "react";
import { expect, test } from "vitest";
import { TabsState } from "../../tabs";
import { menuItemNamed, renderMenuBar } from "./menuBar.test-support";

test("同じメニューをもう一度押すと閉じる", () => {
  const { host } = renderMenuBar(TabsState.create());
  const file = menuItemNamed(host, "ファイル");

  act(() => file.click());
  expect(file.getAttribute("aria-expanded")).toBe("true");
  expect(host.querySelector('[role="menu"]')).not.toBeNull();

  act(() => file.click());

  expect(file.getAttribute("aria-expanded")).toBe("false");
  expect(host.querySelector('[role="menu"]')).toBeNull();
});

test("別のメニューを開くと先に開いたメニューを閉じる", () => {
  const { host } = renderMenuBar(TabsState.create());
  const file = menuItemNamed(host, "ファイル");
  const edit = menuItemNamed(host, "編集");

  act(() => file.click());
  act(() => edit.click());

  expect(file.getAttribute("aria-expanded")).toBe("false");
  expect(edit.getAttribute("aria-expanded")).toBe("true");
  expect(host.querySelector('[role="menu"]')?.getAttribute("aria-label")).toBe(
    "編集",
  );
});

test("コマンドを選ぶとそのコマンドを通知してメニューを閉じる", () => {
  const { host, commands } = renderMenuBar(TabsState.create());
  act(() => menuItemNamed(host, "ファイル").click());

  act(() => menuItemNamed(host, "新規キャンバス").click());

  expect(commands).toEqual(["newCanvas"]);
  expect(host.querySelector('[role="menu"]')).toBeNull();
});

test("無効なコマンドは通知せず、メニューを開いたままにする", () => {
  const { host, commands } = renderMenuBar(TabsState.create());
  act(() => menuItemNamed(host, "ファイル").click());
  const save = menuItemNamed(host, "保存");

  act(() => save.click());

  expect(save.getAttribute("aria-disabled")).toBe("true");
  expect(commands).toEqual([]);
  expect(host.querySelector('[role="menu"]')).not.toBeNull();
});

test("メニュー内のポインター操作では閉じず、外側を押すと閉じる", () => {
  const { host } = renderMenuBar(TabsState.create());
  const file = menuItemNamed(host, "ファイル");
  act(() => file.click());

  act(() =>
    file.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })),
  );
  expect(host.querySelector('[role="menu"]')).not.toBeNull();

  act(() =>
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    ),
  );

  expect(host.querySelector('[role="menu"]')).toBeNull();
});

test("Escape はメニューを閉じるが、他のキーでは閉じない", () => {
  const { host } = renderMenuBar(TabsState.create());
  act(() => menuItemNamed(host, "ファイル").click());
  act(() =>
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" })),
  );
  expect(host.querySelector('[role="menu"]')).not.toBeNull();
  const escapeEvent = new KeyboardEvent("keydown", {
    key: "Escape",
    cancelable: true,
  });

  act(() => document.dispatchEvent(escapeEvent));

  expect(host.querySelector('[role="menu"]')).toBeNull();
  expect(escapeEvent.defaultPrevented).toBe(true);
});

test.each([
  { ctrlKey: true, metaKey: false, key: "s" },
  { ctrlKey: false, metaKey: true, key: "S" },
])("文書を開いていると保存ショートカットが有効になる (%j)", (shortcut) => {
  const state = TabsState.reducer(TabsState.create(), {
    type: "newTab",
    documentType: "canvas",
  });
  const { commands } = renderMenuBar(state);
  const event = new KeyboardEvent("keydown", { ...shortcut, cancelable: true });

  act(() => document.dispatchEvent(event));

  expect(commands).toEqual(["save"]);
  expect(event.defaultPrevented).toBe(true);
});

test("文書がないと保存ショートカットは保存を通知しない", () => {
  const { commands } = renderMenuBar(TabsState.create());
  const event = new KeyboardEvent("keydown", {
    ctrlKey: true,
    key: "s",
    cancelable: true,
  });

  act(() => document.dispatchEvent(event));

  expect(commands).toEqual([]);
  expect(event.defaultPrevented).toBe(true);
});

test.each([
  { key: "s", ctrlKey: true, repeat: true, prevented: true },
  { key: "s", ctrlKey: true, altKey: true, prevented: false },
  { key: "s", ctrlKey: true, shiftKey: true, prevented: false },
  { key: "s", prevented: false },
  { key: "o", ctrlKey: true, prevented: false },
])("リピートや別のキー操作では保存を通知しない (%j)", ({
  prevented,
  ...shortcut
}) => {
  const state = TabsState.reducer(TabsState.create(), {
    type: "newTab",
    documentType: "canvas",
  });
  const { commands } = renderMenuBar(state);
  const event = new KeyboardEvent("keydown", { ...shortcut, cancelable: true });

  act(() => document.dispatchEvent(event));

  expect(commands).toEqual([]);
  expect(event.defaultPrevented).toBe(prevented);
});
