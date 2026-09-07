import { act } from "react";
import { expect, test } from "vitest";
import {
  articleOf,
  buttonNamed,
  clickSurface,
  documentWithConnection,
  documentWithTwoStickies,
  doubleClickSurface,
  editorOf,
  existingStickyDocument,
  renderEditor,
} from "./canvasEditor.test-support";

/** キー入力を発生させ、標準動作の抑止も検証可能にする。 */
const press = (
  target: EventTarget,
  options: KeyboardEventInit,
): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...options,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
};

test.each([
  "Delete",
  "Backspace",
])("%s で付箋と参照接続を削除し undo/redo できる", (key) => {
  const host = renderEditor(documentWithConnection);
  clickSurface(host, { x: 20, y: 30 });
  press(articleOf(host), { key });
  expect(host.querySelectorAll("article")).toHaveLength(1);
  expect(host.querySelectorAll("[data-connection-id]")).toHaveLength(0);
  press(buttonNamed(host, "Domain Event"), { key: "z", ctrlKey: true });
  expect(host.querySelectorAll("article")).toHaveLength(2);
  expect(host.querySelectorAll("[data-connection-id]")).toHaveLength(1);
  press(buttonNamed(host, "Domain Event"), {
    key: "Z",
    ctrlKey: true,
    shiftKey: true,
  });
  expect(host.querySelectorAll("article")).toHaveLength(1);
});

test.each([
  "ctrlKey",
  "metaKey",
] as const)("%s でコピーした付箋を新IDで貼り付け undo/redo できる", (modifier) => {
  const host = renderEditor(documentWithConnection);
  clickSurface(host, { x: 20, y: 30 });
  press(articleOf(host), { key: "c", [modifier]: true });
  expect(buttonNamed(host, "元に戻す").getAttribute("aria-disabled")).toBe(
    "true",
  );
  press(articleOf(host), { key: "v", [modifier]: true });
  const pasted = host.querySelector("article:last-child");
  expect(host.querySelectorAll("article")).toHaveLength(3);
  expect(pasted?.getAttribute("data-sticky-id")).not.toBe("stk_existing000");
  expect(pasted?.textContent).toContain("注文が確定した");
  expect(pasted?.getAttribute("data-sticky-session")).toBe("selected");
  expect(pasted?.getAttribute("style")).toContain("left: 34px");
  expect(host.querySelectorAll("[data-connection-id]")).toHaveLength(1);
  press(buttonNamed(host, "Domain Event"), { key: "z", [modifier]: true });
  expect(host.querySelectorAll("article")).toHaveLength(2);
  press(buttonNamed(host, "Domain Event"), {
    key: "z",
    [modifier]: true,
    shiftKey: true,
  });
  expect(host.querySelectorAll("article")).toHaveLength(3);
});

test("コピー元を削除してもスナップショットを連続して貼り付けられる", () => {
  const host = renderEditor(existingStickyDocument);
  clickSurface(host, { x: 20, y: 30 });
  press(articleOf(host), { key: "c", ctrlKey: true });
  press(articleOf(host), { key: "Delete" });
  const toolbar = buttonNamed(host, "Domain Event");
  press(toolbar, { key: "v", ctrlKey: true });
  press(toolbar, { key: "v", ctrlKey: true });
  const stickies = [...host.querySelectorAll("article")];
  expect(stickies.map((sticky) => sticky.style.left)).toEqual(["34px", "58px"]);
  expect(new Set(stickies.map((sticky) => sticky.dataset.stickyId)).size).toBe(
    2,
  );
});

test("最前面移動は1操作で undo でき、既に最前面なら履歴を増やさない", () => {
  const host = renderEditor(documentWithTwoStickies);
  clickSurface(host, { x: 20, y: 30 });
  const toolbar = buttonNamed(host, "Domain Event");
  press(toolbar, { key: "]", metaKey: true, shiftKey: true });
  press(toolbar, { key: "}", metaKey: true, shiftKey: true });
  expect(
    [...host.querySelectorAll("article")].map(
      (sticky) => sticky.dataset.stickyId,
    ),
  ).toEqual(["stk_front0000000", "stk_existing000"]);
  press(toolbar, { key: "z", metaKey: true });
  expect(
    [...host.querySelectorAll("article")].map(
      (sticky) => sticky.dataset.stickyId,
    ),
  ).toEqual(["stk_existing000", "stk_front0000000"]);
});

test.each([
  "z",
  "c",
  "v",
  "0",
  "=",
  "-",
  "]",
  "Delete",
  "Backspace",
])("本文編集中は %s を標準編集に譲る", (key) => {
  const host = renderEditor(existingStickyDocument);
  doubleClickSurface(host, { x: 20, y: 30 });
  const editor = editorOf(host);
  const event = press(editor, {
    key,
    ctrlKey: !["Delete", "Backspace"].includes(key),
    shiftKey: key === "]",
  });
  expect(event.defaultPrevented).toBe(false);
  expect(editorOf(host)).toBe(editor);
  expect(host.querySelectorAll("article")).toHaveLength(1);
  expect(host.querySelector('[aria-label="ズーム 100%"]')).not.toBeNull();
});

test.each(["input", "select"])("%s 内のキー入力を妨げない", (kind) => {
  const host = renderEditor(existingStickyDocument);
  clickSurface(host, { x: 20, y: 30 });
  const control = document.createElement(kind);
  host.querySelector(".canvas-surface")?.append(control);
  expect(press(control, { key: "Delete" }).defaultPrevented).toBe(false);
  expect(press(control, { key: "=", ctrlKey: true }).defaultPrevented).toBe(false);
  expect(host.querySelectorAll("article")).toHaveLength(1);
  expect(host.querySelector('[aria-label="ズーム 100%"]')).not.toBeNull();
});

test("contenteditable の子要素で編集標準キーを妨げない", () => {
  const host = renderEditor(existingStickyDocument);
  clickSurface(host, { x: 20, y: 30 });
  const control = document.createElement("div");
  control.setAttribute("contenteditable", "true");
  const child = document.createElement("span");
  control.append(child);
  host.querySelector(".canvas-surface")?.append(control);
  expect(press(child, { key: "Delete" }).defaultPrevented).toBe(false);
  expect(press(child, { key: "=", ctrlKey: true }).defaultPrevented).toBe(false);
  expect(host.querySelectorAll("article")).toHaveLength(1);
  expect(host.querySelector('[aria-label="ズーム 100%"]')).not.toBeNull();
});

test("IME変換中・処理済み・未割り当ての修飾キーは操作しない", () => {
  const host = renderEditor(existingStickyDocument);
  clickSurface(host, { x: 20, y: 30 });
  const sticky = articleOf(host);
  for (const options of [
    { key: "Delete", isComposing: true },
    { key: "Delete", keyCode: 229 },
    { key: "Delete", altKey: true },
    { key: "Delete", ctrlKey: true },
    { key: "v", ctrlKey: true, shiftKey: true },
  ]) {
    expect(press(sticky, options).defaultPrevented).toBe(false);
  }
  sticky.addEventListener("keydown", (event) => event.preventDefault(), {
    once: true,
  });
  press(sticky, { key: "Delete" });
  expect(host.querySelectorAll("article")).toHaveLength(1);
});

test("別キャンバスと画面外にはショートカットを適用しない", () => {
  const first = renderEditor(existingStickyDocument);
  const second = renderEditor(existingStickyDocument);
  clickSurface(first, { x: 20, y: 30 });
  clickSurface(second, { x: 20, y: 30 });
  press(document.body, { key: "Delete" });
  expect(first.querySelectorAll("article")).toHaveLength(1);
  press(articleOf(first), { key: "Delete" });
  expect(first.querySelectorAll("article")).toHaveLength(0);
  expect(second.querySelectorAll("article")).toHaveLength(1);
  press(buttonNamed(first, "Domain Event"), { key: "=", ctrlKey: true });
  expect(first.querySelector('[aria-label="ズーム 120%"]')).not.toBeNull();
  expect(second.querySelector('[aria-label="ズーム 100%"]')).not.toBeNull();
});
