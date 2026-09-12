export type TextEdit = Readonly<{
  start: number;
  end: number;
  replacement: string;
}>;

/** `.dmodel` の入力支援で行う、1回分のテキスト編集。 */
export const TextEdit = {
  /**
   * 選択範囲を2個のスペースへ置き換える編集を作る。
   *
   * @param selection テキスト入力欄の現在の選択範囲。
   * @returns Tab入力1回分の編集。
   */
  insertTab(
    selection: Readonly<{ start: number; end: number }>,
  ): TextEdit {
    return { ...selection, replacement: "  " };
  },

  /**
   * 選択開始位置の行頭空白を引き継ぐ改行編集を作る。
   *
   * @param source 文書全文と現在の選択範囲。
   * @returns Enter入力1回分の編集。
   */
  insertLineBreak(
    source: Readonly<{ text: string; start: number; end: number }>,
  ): TextEdit {
    const lineStart = source.text.lastIndexOf("\n", source.start - 1) + 1;
    const line = source.text.slice(lineStart, source.start);
    const contentStart = line.search(/[^\t ]/);
    const indentation = contentStart === -1 ? line : line.slice(0, contentStart);
    return {
      start: source.start,
      end: source.end,
      replacement: `\n${indentation}`,
    };
  },

  /**
   * 文書に1回分の編集を反映する。
   *
   * @param text 編集前の文書全文。
   * @param edit 置換範囲と挿入文字列。
   * @returns 編集後の文書全文。
   */
  apply(text: string, edit: TextEdit): string {
    return `${text.slice(0, edit.start)}${edit.replacement}${text.slice(edit.end)}`;
  },
} as const;
