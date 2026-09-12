import { act } from "react";
import { afterEach, expect, test } from "vitest";
import {
  createEditorRenderer,
  setNativeTextareaValue,
} from "./modelEditor.test-support";

const editors = createEditorRenderer();
afterEach(() => {
  editors.unmountAll();
});

test("パースエラー行は背景と行末メッセージを表示する", () => {
  const { host } = editors.setup("data 数量 = int constrained 10..1");

  expect(
    host.querySelector(".model-editor__diagnostics-line--error"),
  ).not.toBeNull();
  expect(
    host.querySelector(".model-editor__diagnostics-message")?.textContent,
  ).toBe("範囲の下限が上限を超えています");
});

test("未定義参照は点線下線になりエラー行にはしない", () => {
  const { host } = editors.setup("data 注文 = 未定義型");

  expect(host.querySelector(".model-editor__diagnostics-line--error")).toBeNull();
  expect(
    host.querySelector(".model-editor__diagnostics-warning")?.textContent,
  ).toBe("未定義型");
});

test("パースエラーがあっても入力内容を親へ反映する", () => {
  const editor = editors.setup("data 注文ID = string");
  act(() => {
    setNativeTextareaValue(editor.input, "data 注文 =\n");
    editor.input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  expect(editor.text()).toBe("data 注文 =\n");
  expect(editor.input.disabled).toBe(false);
});

test("縦スクロールに診断レイヤが追従する", () => {
  const { host, input } = editors.setup("data A = string\n".repeat(100));
  act(() => {
    input.scrollTop = 240;
    input.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  expect(host.querySelector(".model-editor__diagnostics")?.scrollTop).toBe(240);
});

test("パースエラーは入力欄の説明として読み上げられる", () => {
  const { host, input } = editors.setup("data 数量 = int constrained 10..1");
  const describedBy = input.getAttribute("aria-describedby");

  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(describedBy).not.toBeNull();
  expect(
    host.querySelector(`#${CSS.escape(describedBy ?? "")}`)?.textContent,
  ).toBe("範囲の下限が上限を超えています");
});

test("未定義参照も入力欄の説明に含め無効状態にはしない", () => {
  const { host, input } = editors.setup("data 注文 = 未定義型");
  const describedBy = input.getAttribute("aria-describedby");

  expect(input.getAttribute("aria-invalid")).toBe("false");
  expect(
    host.querySelector(`#${CSS.escape(describedBy ?? "")}`)?.textContent,
  ).toBe("「未定義型」は未定義です");
});

test("正しい文書では入力欄を無効状態にせず説明も付けない", () => {
  const { input } = editors.setup("data 注文ID = string");

  expect(input.getAttribute("aria-invalid")).toBe("false");
  expect(input.getAttribute("aria-describedby")).toBeNull();
});
