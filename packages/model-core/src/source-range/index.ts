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
   * 開始行・桁、終了行・桁の順に範囲を比較する。
   * @param ranges 比較する範囲の組。left を right と比較する。
   * @returns left が前なら負、同じなら 0、後なら正の数。
   */
  compare: (
    ranges: Readonly<{ left: SourceRange; right: SourceRange }>,
  ): number => {
    const { left, right } = ranges;
    const orders = [
      left.startLine - right.startLine,
      left.startColumn - right.startColumn,
      left.endLine - right.endLine,
      left.endColumn - right.endColumn,
    ];

    return orders.find((order) => order !== 0) ?? 0;
  },

  /**
   * 指定範囲が、もう一方の範囲を包含するか判定する。
   * @param ranges 包含する側の outer と、包含される側の inner の組。
   * @returns outer が inner の開始・終了位置を含む場合は `true`。
   */
  contains: (
    ranges: Readonly<{ outer: SourceRange; inner: SourceRange }>,
  ): boolean => {
    const { outer, inner } = ranges;
    const startsInside =
      inner.startLine > outer.startLine ||
      (inner.startLine === outer.startLine &&
        inner.startColumn >= outer.startColumn);
    const endsInside =
      inner.endLine < outer.endLine ||
      (inner.endLine === outer.endLine && inner.endColumn <= outer.endColumn);

    return startsInside && endsInside;
  },

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

  /**
   * 2つの範囲が同じ位置かを判定する。
   * @param left 比較する範囲。
   * @param right 比較する範囲。
   * @returns 行と桁がすべて一致すれば `true`。
   */
  equals: (left: SourceRange, right: SourceRange): boolean =>
    left.startLine === right.startLine &&
    left.startColumn === right.startColumn &&
    left.endLine === right.endLine &&
    left.endColumn === right.endColumn,

  /**
   * 範囲が指定した行を含むか判定する。
   * 空範囲でも開始行(終了行)は含む。
   * @param range 判定する範囲。
   * @param line 行番号(1始まり)。
   * @returns 行が範囲内なら `true`。
   */
  coversLine: (range: SourceRange, line: number): boolean =>
    line >= range.startLine && line <= range.endLine,
} as const;
