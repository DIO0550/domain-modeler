import type { SourceRange } from "@domain-modeler/model-core";
import { Option, type Option as OptionType } from "@/utils/Option";

/** テキスト入力欄のキャレット位置。オフセットは 0 始まり、行は 1 始まり。 */
export type CaretPosition = Readonly<{
  offset: number;
  line: number;
}>;

/**
 * 各行の先頭オフセットを出現順に返す。
 *
 * @param source 文書全文。
 * @returns 1行目から最終行(末尾改行による空行を含む)の先頭オフセット。
 */
const lineStartOffsets = (source: string): readonly number[] => [
  0,
  ...[...source.matchAll(/\r\n|\r|\n/g)].map(
    (match) => (match.index ?? 0) + match[0].length,
  ),
];

/** ソース位置とキャレット位置を相互に変換する関数群。 */
export const CaretPosition = {
  /**
   * 1始まりの行と桁をキャレット位置にする。
   *
   * @param source 文書全文。
   * @param line 行番号(1始まり)。
   * @param column 桁(1始まり)。
   * @returns その位置。行が文書に無い場合は値なし。
   */
  fromLineColumn(
    source: string,
    line: number,
    column: number,
  ): OptionType<CaretPosition> {
    const lineStart = lineStartOffsets(source)[line - 1];
    if (lineStart === undefined) {
      return Option.none();
    }
    return Option.some({
      offset: lineStart + column - 1,
      line,
    });
  },
  /**
   * ソース範囲の開始位置をキャレット位置にする。
   *
   * @param source 文書全文。
   * @param range 1始まりのソース範囲。
   * @returns 範囲の開始位置。行が文書に無い場合は値なし。
   */
  fromRange(
    source: string,
    range: SourceRange,
  ): OptionType<CaretPosition> {
    return CaretPosition.fromLineColumn(
      source,
      range.startLine,
      range.startColumn,
    );
  },
  /**
   * 文字オフセットから行番号付きのキャレット位置を作る。
   *
   * @param source 文書全文。
   * @param offset 0始まりの文字位置。
   * @returns オフセットとその行。
   */
  atOffset(source: string, offset: number): CaretPosition {
    const line = lineStartOffsets(source).reduce(
      (current, start, index) => (start <= offset ? index + 1 : current),
      1,
    );
    return { offset, line };
  },
} as const;
