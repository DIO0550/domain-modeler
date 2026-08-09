import type { ValueOf } from "../types/value-of";
import { SourceRange } from "../source-range";

/** トークン種別の列挙値。 */
export const TOKEN_KINDS = {
  comment: "comment",
  blankLine: "blankLine",
  indent: "indent",
  reserved: "reserved",
  identifier: "identifier",
  equals: "equals",
  rangeDots: "rangeDots",
  number: "number",
} as const;

/** トークン種別。 */
export type TokenKind = ValueOf<typeof TOKEN_KINDS>;

/** DSL の1トークン。 */
export type Token = Readonly<{
  kind: TokenKind;
  text: string;
  range: SourceRange;
}>;

/** トークンを生成する関数群。 */
export const Token = {
  /**
   * 種別・文字列・開始位置からトークンを生成する。
   * @param kind トークン種別。
   * @param text トークン文字列。
   * @param line 行番号(1始まり)。
   * @param startColumn 開始桁(1始まり・含む)。
   * @returns 生成したトークン。
   */
  create: (
    kind: TokenKind,
    text: string,
    line: number,
    startColumn: number,
  ): Token => ({
    kind,
    text,
    range: SourceRange.onLine(line, startColumn, startColumn + text.length),
  }),
} as const;
