type TextInputEdit = Readonly<{
  start: number;
  end: number;
  replacement: string;
}>;

type TextInputCaret = Readonly<{
  offset: number;
  line: number;
}>;

type TextInputSelection = Readonly<{
  start: number;
  end: number;
  line: number;
}>;

const FALLBACK_LINE_HEIGHT_PX = 24;

/**
 * 指定行が入力欄の可視範囲に入るよう縦スクロールする。
 *
 * @param input テキスト入力欄。
 * @param line 1始まりの行番号。
 */
const scrollToLine = (input: HTMLTextAreaElement, line: number): void => {
  const style = getComputedStyle(input);
  const parsedLineHeight = Number.parseFloat(style.lineHeight);
  const lineHeight = Number.isFinite(parsedLineHeight)
    ? parsedLineHeight
    : FALLBACK_LINE_HEIGHT_PX;
  const paddingTop = Number.parseFloat(style.paddingTop);
  const topPadding = Number.isFinite(paddingTop) ? paddingTop : 0;
  const lineTop = topPadding + (line - 1) * lineHeight;
  const lineBottom = lineTop + lineHeight;
  if (lineTop < input.scrollTop) {
    input.scrollTop = Math.max(0, lineTop - topPadding);
    return;
  }
  if (lineBottom > input.scrollTop + input.clientHeight) {
    input.scrollTop = Math.max(0, lineBottom - input.clientHeight);
  }
};

/** ブラウザ標準のテキスト入力履歴を保って入力欄を編集する関数群。 */
export const TextInput = {
  /**
   * 選択範囲を1回の入力操作として置き換える。
   * ネイティブ undo に積むため、入力欄へフォーカスしてから置換する。
   *
   * @param input 編集対象のテキスト入力欄。
   * @param edit 置換範囲と挿入文字列。
   */
  applyEdit(input: HTMLTextAreaElement, edit: TextInputEdit): void {
    input.focus();
    input.setSelectionRange(edit.start, edit.end);

    // execCommand は非推奨だが、現行WebViewでネイティブundo履歴へ
    // プログラム編集を1操作として積める唯一のAPIなので境界として利用する。
    if (
      typeof document.execCommand === "function" &&
      document.execCommand("insertText", false, edit.replacement)
    ) {
      return;
    }

    const editedText = `${input.value.slice(0, edit.start)}${edit.replacement}${input.value.slice(edit.end)}`;
    const nativeValueSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    const inputEvent = new InputEvent("input", {
      bubbles: true,
      data: edit.replacement,
      inputType: "insertText",
    });
    if (nativeValueSetter === undefined) {
      input.setRangeText(edit.replacement, edit.start, edit.end, "end");
      input.dispatchEvent(inputEvent);
      return;
    }

    nativeValueSetter.call(input, editedText);
    const caret = edit.start + edit.replacement.length;
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(inputEvent);
  },
  /**
   * キャレットを指定位置へ移し、その行が見えるようスクロールする。
   *
   * @param input テキスト入力欄。
   * @param caret 0始まりのオフセットと 1始まりの行。
   */
  moveCaret(input: HTMLTextAreaElement, caret: TextInputCaret): void {
    TextInput.select(input, {
      start: caret.offset,
      end: caret.offset,
      line: caret.line,
    });
  },
  /**
   * 選択範囲を指定し、その行が見えるようスクロールする。
   *
   * @param input テキスト入力欄。
   * @param selection 0始まりの開始・終了と 1始まりの行。
   */
  select(input: HTMLTextAreaElement, selection: TextInputSelection): void {
    const start = Math.max(0, Math.min(selection.start, input.value.length));
    const end = Math.max(0, Math.min(selection.end, input.value.length));
    input.focus();
    input.setSelectionRange(start, end, "forward");
    scrollToLine(input, selection.line);
    input.dispatchEvent(new Event("scroll", { bubbles: true }));
  },
} as const;
