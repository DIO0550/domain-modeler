import { expect, test } from "vitest";
import { CanvasShortcut } from "../index";

const unmodified = {
  ctrlKey: false, metaKey: false, altKey: false, shiftKey: false,
  isComposing: false, keyCode: 0,
};

test.each([
  ["z", "undo"], ["Z", "undo"], ["c", "copy"], ["v", "paste"],
  ["0", "fitAll"], ["=", "zoomIn"], ["+", "zoomIn"], ["-", "zoomOut"],
])("Ctrl と Cmd の %s は %s に対応する", (key, command) => {
  expect(CanvasShortcut.create({ ...unmodified, key, ctrlKey: true }))
    .toEqual({ some: true, value: command });
  expect(CanvasShortcut.create({ ...unmodified, key, metaKey: true }))
    .toEqual({ some: true, value: command });
});

test.each([
  ["z", "redo"], ["Z", "redo"], ["]", "front"], ["}", "front"], ["+", "zoomIn"],
])("Shift と Ctrl/Cmd の %s は %s を優先する", (key, command) => {
  expect(CanvasShortcut.create({ ...unmodified, key, ctrlKey: true, shiftKey: true }))
    .toEqual({ some: true, value: command });
  expect(CanvasShortcut.create({ ...unmodified, key, metaKey: true, shiftKey: true }))
    .toEqual({ some: true, value: command });
});

test.each(["Delete", "Backspace"])("修飾なしの %s は削除になる", (key) => {
  expect(CanvasShortcut.create({ ...unmodified, key })).toEqual({ some: true, value: "delete" });
});

test.each([
  { key: "z" }, { key: "F1", ctrlKey: true }, { key: "y", ctrlKey: true },
  { key: "v", ctrlKey: true, shiftKey: true }, { key: "]", ctrlKey: true },
  { key: "Delete", ctrlKey: true }, { key: "Backspace", shiftKey: true },
  { key: "z", ctrlKey: true, altKey: true },
  { key: "z", ctrlKey: true, isComposing: true },
  { key: "Delete", keyCode: 229 },
])("未割り当て・IME入力は操作を返さない: %j", (event) => {
  expect(CanvasShortcut.create({ ...unmodified, ...event })).toEqual({ some: false });
});

test.each([
  [{ key: "à", code: "Digit0" }, "fitAll"],
  [{ key: "0", code: "Digit0", shiftKey: true }, "fitAll"],
  [{ key: "=", code: "Digit0", shiftKey: true }, "fitAll"],
  [{ key: "+", code: "Digit0", shiftKey: true }, "fitAll"],
  [{ key: "0", code: "Equal", shiftKey: true }, "zoomIn"],
  [{ key: "=", code: "Minus", shiftKey: true }, "zoomOut"],
  [{ key: "0", code: "Numpad0", shiftKey: true }, "fitAll"],
  [{ key: "^", code: "Equal" }, "zoomIn"],
  [{ key: ")", code: "Minus" }, "zoomOut"],
  [{ key: "°", code: "Minus", shiftKey: true }, "zoomOut"],
  [{ key: "-", code: "Digit6", shiftKey: true }, "zoomOut"],
  [{ key: "£", code: "BracketRight", shiftKey: true }, "front"],
  [{ key: "]", code: "Backslash", shiftKey: true }, "front"],
] as const)("非US配列でも記号の文字または物理位置で操作できる: %j", (event, command) => {
  expect(CanvasShortcut.create({ ...unmodified, ...event, ctrlKey: true }))
    .toEqual({ some: true, value: command });
  expect(CanvasShortcut.create({ ...unmodified, ...event, metaKey: true }))
    .toEqual({ some: true, value: command });
});

test.each([
  { key: "à", code: "Digit0" },
  { key: "£", code: "BracketRight", ctrlKey: true },
  { key: "à", code: "Digit0", ctrlKey: true, altKey: true },
  { key: "à", code: "Digit0", ctrlKey: true, isComposing: true },
  { key: "à", code: "Digit0", ctrlKey: true, keyCode: 229 },
  { key: "w", code: "KeyZ", ctrlKey: true },
])("物理位置で判定しても修飾キー・IME・英字配列を尊重する: %j", (event) => {
  expect(CanvasShortcut.create({ ...unmodified, ...event })).toEqual({ some: false });
});
