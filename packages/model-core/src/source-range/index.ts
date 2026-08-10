/** ソース上の位置範囲。行・桁は 1 始まり、終端桁は排他的。 */
export type SourceRange = Readonly<{
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}>;

/** ソース範囲を生成する関数群。 */
export const SourceRange = {
  /**
   * 同一行上の範囲を生成する。
   * @param line 行番号(1始まり)。
   * @param startColumn 開始桁(1始まり・含む)。
   * @param endColumn 終了桁(1始まり・含まない)。
   * @returns ソース範囲。
   */
  onLine: (
    line: number,
    startColumn: number,
    endColumn: number,
  ): SourceRange => ({
    startLine: line,
    startColumn,
    endLine: line,
    endColumn,
  }),
  /**
   * 2つの範囲を包含する最小範囲を生成する。
   * @param start 開始側の範囲。
   * @param end 終了側の範囲。
   * @returns 両端を含むソース範囲。
   */
  span: (start: SourceRange, end: SourceRange): SourceRange => ({
    startLine: start.startLine,
    startColumn: start.startColumn,
    endLine: end.endLine,
    endColumn: end.endColumn,
  }),
} as const;
