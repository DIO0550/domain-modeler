import { act } from "react";
import { createRoot } from "react-dom/client";
import { ModelEditor } from "../index";

export type RenderedEditor = Readonly<{
  host: HTMLDivElement;
  input: HTMLTextAreaElement;
  render: (value: string) => void;
  text: () => string;
}>;

type EditorRenderer = Readonly<{
  setup: (initialValue: string) => RenderedEditor;
  unmountAll: () => void;
}>;

/**
 * テストファイルごとに独立したエディタ描画器を作る。
 * @returns 描画と一括破棄。
 */
export const createEditorRenderer = (): EditorRenderer => {
  const cleanup: (() => void)[] = [];
  return {
    setup: (initialValue) => {
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
      const found = host.querySelector("textarea");
      const input =
        found instanceof HTMLTextAreaElement
          ? found
          : document.createElement("textarea");
      return { host, input, render, text: () => text };
    },
    unmountAll: () => {
      cleanup.splice(0).forEach((dispose) => dispose());
    },
  };
};

/**
 * React の値追跡を経由せず textarea の値を更新する。
 * @param input 入力欄。
 * @param value セットする全文。
 */
export const setNativeTextareaValue = (
  input: HTMLTextAreaElement,
  value: string,
): void => {
  Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set?.call(input, value);
};

/**
 * 入力欄の選択範囲と向きを設定する。
 * @param input 入力欄。
 * @param start 開始位置。
 * @param end 終了位置。
 */
export const select = (
  input: HTMLTextAreaElement,
  start: number,
  end: number,
): void => {
  act(() => {
    input.focus();
    input.setSelectionRange(start, end, "backward");
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
  });
};
