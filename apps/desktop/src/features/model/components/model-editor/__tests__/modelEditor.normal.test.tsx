import { act } from "react";
import { afterEach, expect, test } from "vitest";
import {
  createEditorRenderer,
  select,
  setNativeTextareaValue,
} from "./modelEditor.test-support";

const editors = createEditorRenderer();
afterEach(() => {
  editors.unmountAll();
});

test("空文書にも1行目が表示される", () => {
  const { host, input } = editors.setup("");
  expect(input.value).toBe("");
  expect(host.querySelector(".model-editor__line-numbers")?.textContent).toBe(
    "1",
  );
});

test("空行と末尾の改行を含む全文を表示する", () => {
  const text = "// コメント\n\ndata Broken =\n";
  const { host, input } = editors.setup(text);
  expect(input.value).toBe(text);
  expect(
    host.querySelector(".model-editor__line-numbers")?.children.length,
  ).toBe(4);
});

test("編集中の不完全な構文も全文として親へ反映する", () => {
  const editor = editors.setup("data Order = string");
  act(() => {
    // ブラウザ入力と同様に、ネイティブの setter で React の値追跡を経由せず更新する。
    setNativeTextareaValue(editor.input, "data Order =\n  未確定\n");
    editor.input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(editor.text()).toBe("data Order =\n  未確定\n");
  expect(
    editor.host.querySelector(".model-editor__line-numbers")?.children.length,
  ).toBe(3);
});

test("親の再描画後も選択範囲と向きを維持する", () => {
  const { input, render } = editors.setup("data Order = string");
  select(input, 5, 10);
  render("data Order = string");
  expect([
    input.selectionStart,
    input.selectionEnd,
    input.selectionDirection,
  ]).toEqual([5, 10, "backward"]);
});

test("全文が外部から置き換わっても有効な選択範囲は維持する", () => {
  const { input, render } = editors.setup("data Order = string");
  select(input, 5, 10);
  render("data Order = int\n");
  expect(input.value).toBe("data Order = int\n");
  expect([
    input.selectionStart,
    input.selectionEnd,
    input.selectionDirection,
  ]).toEqual([5, 10, "backward"]);
});

test("全文更新後に元の位置が存在しない場合は文書先頭へ戻る", () => {
  const { input, render } = editors.setup("data Order = string");
  select(input, 15, 15);
  render("//");
  expect([input.selectionStart, input.selectionEnd]).toEqual([0, 0]);
});

test("IME変換中は外部の全文更新を表示せず、変換確定後に反映する", () => {
  const { input, render } = editors.setup("data Order = string");
  select(input, 5, 10);
  act(() => {
    input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
  });

  render("data External = string");
  expect(input.value).toBe("data Order = string");

  act(() => {
    input.setSelectionRange(8, 8, "none");
    input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
  });
  expect(input.value).toBe("data External = string");
  expect([input.selectionStart, input.selectionEnd]).toEqual([8, 8]);
});

test("IME変換中の入力は保留中の外部更新を親で上書きしない", () => {
  const editor = editors.setup("data Order = string");
  act(() => {
    editor.input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
  });
  editor.render("data External = string");

  act(() => {
    setNativeTextareaValue(editor.input, "data 注文 = string");
    editor.input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
  expect(editor.text()).toBe("data External = string");
  expect(editor.input.value).toBe("data 注文 = string");

  act(() => {
    editor.input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
  });
  expect(editor.text()).toBe("data External = string");
  expect(editor.input.value).toBe("data External = string");
});

test("IME変換確定後のinputは保留中の外部更新を上書きしない", () => {
  const editor = editors.setup("data Order = string");
  act(() => {
    editor.input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
  });
  editor.render("data External = string");

  act(() => {
    setNativeTextareaValue(editor.input, "data 注文 = string");
    editor.input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
  });
  expect(editor.input.value).toBe("data External = string");

  act(() => {
    setNativeTextareaValue(editor.input, "data 注文 = string");
    editor.input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
  expect(editor.text()).toBe("data External = string");
  expect(editor.input.value).toBe("data External = string");
});

test("確定inputが先に発火した場合は次の通常入力を破棄しない", async () => {
  const editor = editors.setup("data Order = string");
  act(() => {
    editor.input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
  });
  editor.render("data External = string");

  act(() => {
    setNativeTextareaValue(editor.input, "data 注文 = string");
    editor.input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    editor.input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
  });
  await act(async () => Promise.resolve());

  act(() => {
    setNativeTextareaValue(editor.input, "data 注文 = string");
    editor.input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
  expect(editor.text()).toBe("data 注文 = string");
  expect(editor.input.value).toBe("data 注文 = string");
});

test("IME変換の確定値は確定後のinputイベントを待たず親へ反映する", () => {
  const editor = editors.setup("data Order = string");
  act(() => {
    editor.input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
  });
  act(() => {
    setNativeTextareaValue(editor.input, "data 注文 = string");
    editor.input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
  });
  expect(editor.text()).toBe("data 注文 = string");
  expect(editor.input.value).toBe("data 注文 = string");
});

test("Tab入力はフォーカスを移動せず選択位置へスペース2個を挿入する", () => {
  const editor = editors.setup("data Order = string");
  select(editor.input, 5, 5);
  const keydown = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Tab",
  });
  act(() => editor.input.dispatchEvent(keydown));
  expect(editor.text()).toBe("data   Order = string");
  expect(keydown.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(editor.input);
  expect([editor.input.selectionStart, editor.input.selectionEnd]).toEqual([7, 7]);
});

test("Shift+Tab入力は横取りせず既定のフォーカス移動へ委ねる", () => {
  const editor = editors.setup("data Order = string");
  select(editor.input, 5, 5);
  const keydown = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Tab",
    shiftKey: true,
  });
  act(() => editor.input.dispatchEvent(keydown));
  expect(editor.text()).toBe("data Order = string");
  expect(keydown.defaultPrevented).toBe(false);
});

test("改行入力は現在行のインデントを引き継ぐ", () => {
  const editor = editors.setup("data Order =\n  OrderId AND Customer");
  select(editor.input, editor.input.value.length, editor.input.value.length);
  act(() => {
    editor.input.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
      }),
    );
  });
  expect(editor.text()).toBe("data Order =\n  OrderId AND Customer\n  ");
  expect([editor.input.selectionStart, editor.input.selectionEnd]).toEqual([
    editor.input.value.length,
    editor.input.value.length,
  ]);
});

test("IME変換中のEnter入力は自動インデントとして横取りしない", () => {
  const editor = editors.setup("  OrderId");
  act(() => {
    editor.input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
  });
  const keydown = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Enter",
  });
  act(() => editor.input.dispatchEvent(keydown));
  expect(keydown.defaultPrevented).toBe(false);
  expect(editor.text()).toBe("  OrderId");
});

test("外部更新で別の入力欄からフォーカスを奪わない", () => {
  const { input, render, host } = editors.setup("data Order = string");
  select(input, 5, 10);
  const other = document.createElement("button");
  host.append(other);
  act(() => other.focus());
  render("data Order = int");
  expect(document.activeElement).toBe(other);
});

test("縦スクロールに行番号が追従する", () => {
  const { host, input } = editors.setup("data A = string\n".repeat(100));
  act(() => {
    input.scrollTop = 240;
    input.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  expect(host.querySelector(".model-editor__gutter")?.scrollTop).toBe(240);
});
