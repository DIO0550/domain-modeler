type TextInputEdit = Readonly<{
  start: number;
  end: number;
  replacement: string;
}>;

/** ブラウザ標準のテキスト入力履歴を保って入力欄を編集する関数群。 */
export const TextInput = {
  /**
   * 選択範囲を1回の入力操作として置き換える。
   *
   * @param input 編集対象のテキスト入力欄。
   * @param edit 置換範囲と挿入文字列。
   */
  applyEdit(input: HTMLTextAreaElement, edit: TextInputEdit): void {
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
    if (nativeValueSetter === undefined) {
      input.setRangeText(edit.replacement, edit.start, edit.end, "end");
    } else {
      nativeValueSetter.call(input, editedText);
      const caret = edit.start + edit.replacement.length;
      input.setSelectionRange(caret, caret);
    }
    input.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: edit.replacement,
        inputType: "insertText",
      }),
    );
  },
} as const;
