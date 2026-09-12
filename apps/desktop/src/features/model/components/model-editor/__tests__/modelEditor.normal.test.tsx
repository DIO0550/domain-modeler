import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { ModelEditor } from "../index";

const cleanup: (() => void)[] = [];
afterEach(() => {
  cleanup.splice(0).forEach((dispose) => dispose());
});

function setup(initialValue: string) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let text = initialValue;
  const render = (value: string) => {
    text = value;
    act(() => root.render(<ModelEditor value={text} onChange={render} />));
  };
  render(initialValue);
  cleanup.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  const input = host.querySelector("textarea");
  if (input === null) {
    throw new Error("Editor input missing");
  }
  return { host, input, render, text: () => text };
}

function select(input: HTMLTextAreaElement, start: number, end: number) {
  act(() => {
    input.focus();
    input.setSelectionRange(start, end, "backward");
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
  });
}

test("空文書にも1行目が表示される", () => {
  const { host, input } = setup("");
  expect(input.value).toBe("");
  expect(host.querySelector(".model-editor__line-numbers")?.textContent).toBe(
    "1",
  );
});

test("空行と末尾の改行を含む全文を表示する", () => {
  const text = "// コメント\n\ndata Broken =\n";
  const { host, input } = setup(text);
  expect(input.value).toBe(text);
  expect(
    host.querySelector(".model-editor__line-numbers")?.children.length,
  ).toBe(4);
});

test("編集中の不完全な構文も全文として親へ反映する", () => {
  const editor = setup("data Order = string");
  act(() => {
    // ブラウザ入力と同様に、ネイティブの setter で React の値追跡を経由せず更新する。
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    if (setter === undefined) {
      throw new Error("Native value setter missing");
    }
    setter.call(editor.input, "data Order =\n  未確定\n");
    editor.input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(editor.text()).toBe("data Order =\n  未確定\n");
  expect(
    editor.host.querySelector(".model-editor__line-numbers")?.children.length,
  ).toBe(3);
});

test("親の再描画後も選択範囲と向きを維持する", () => {
  const { input, render } = setup("data Order = string");
  select(input, 5, 10);
  render("data Order = string");
  expect([
    input.selectionStart,
    input.selectionEnd,
    input.selectionDirection,
  ]).toEqual([5, 10, "backward"]);
});

test("全文が外部から置き換わっても有効な選択範囲は維持する", () => {
  const { input, render } = setup("data Order = string");
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
  const { input, render } = setup("data Order = string");
  select(input, 15, 15);
  render("//");
  expect([input.selectionStart, input.selectionEnd]).toEqual([0, 0]);
});

test("IME変換中は外部の全文更新を表示せず、変換確定後に反映する", () => {
  const { input, render } = setup("data Order = string");
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
  const editor = setup("data Order = string");
  act(() => {
    editor.input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
  });
  editor.render("data External = string");

  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  if (setter === undefined) {
    throw new Error("Native value setter missing");
  }
  act(() => {
    setter.call(editor.input, "data 注文 = string");
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
  const editor = setup("data Order = string");
  act(() => {
    editor.input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
  });
  editor.render("data External = string");

  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  if (setter === undefined) {
    throw new Error("Native value setter missing");
  }
  act(() => {
    setter.call(editor.input, "data 注文 = string");
    editor.input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
  });
  expect(editor.input.value).toBe("data External = string");

  act(() => {
    setter.call(editor.input, "data 注文 = string");
    editor.input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
  expect(editor.text()).toBe("data External = string");
  expect(editor.input.value).toBe("data External = string");
});

test("IME変換の確定値は確定後のinputイベントを待たず親へ反映する", () => {
  const editor = setup("data Order = string");
  act(() => {
    editor.input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
  });
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  if (setter === undefined) {
    throw new Error("Native value setter missing");
  }
  act(() => {
    setter.call(editor.input, "data 注文 = string");
    editor.input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
  });
  expect(editor.text()).toBe("data 注文 = string");
  expect(editor.input.value).toBe("data 注文 = string");
});

test("Tab入力はフォーカスを移動せず選択位置へスペース2個を挿入する", () => {
  const editor = setup("data Order = string");
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
  const editor = setup("data Order = string");
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
  const editor = setup("data Order =\n  OrderId AND Customer");
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
  const editor = setup("  OrderId");
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
  const { input, render, host } = setup("data Order = string");
  select(input, 5, 10);
  const other = document.createElement("button");
  host.append(other);
  act(() => other.focus());
  render("data Order = int");
  expect(document.activeElement).toBe(other);
});

test("縦スクロールに行番号が追従する", () => {
  const { host, input } = setup("data A = string\n".repeat(100));
  act(() => {
    input.scrollTop = 240;
    input.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  expect(host.querySelector(".model-editor__gutter")?.scrollTop).toBe(240);
});
