import { RESERVED_WORDS } from "../../reserved-word";
import { SourceRange, type SourceRange as Range } from "../../source-range";
import { TOKEN_KINDS, type Token } from "../../token";

/** 宣言単位のトークンチャンク(data / workflow)。 */
export type DeclChunk = Readonly<{
  kind: "data" | "workflow";
  tokens: readonly Token[];
  range: Range;
}>;

const emptyRange = (): Range => SourceRange.onLine(1, 1, 1);

const isSyncToken = (token: Token): boolean =>
  token.kind === TOKEN_KINDS.reserved &&
  (token.text === RESERVED_WORDS.data ||
    token.text === RESERVED_WORDS.workflow) &&
  token.range.startColumn === 1;

/** 宣言チャンクを生成・分割する関数群。 */
export const DeclChunk = {
  /**
   * トークン列全体を包含するソース範囲を返す。
   * @param tokens トークン列。
   * @returns ソース範囲。空なら 1:1 の空範囲。
   */
  rangeOf: (tokens: readonly Token[]): Range => {
    const first = tokens[0];
    const last = tokens[tokens.length - 1];
    if (first === undefined || last === undefined) {
      return emptyRange();
    }
    return SourceRange.span(first.range, last.range);
  },
  /**
   * トークン列を宣言チャンクに分割する。
   * 非インデントの data / workflow を同期ポイントとする。
   * @param tokens 全文のトークン列。
   * @returns 宣言チャンク列。
   */
  split: (tokens: readonly Token[]): readonly DeclChunk[] => {
    const syncIndexes = tokens.flatMap((token, index) =>
      isSyncToken(token) ? [index] : [],
    );
    return syncIndexes.map((startIndex, order) => {
      const nextSync = syncIndexes[order + 1];
      const endIndex = nextSync === undefined ? tokens.length : nextSync;
      const chunkTokens = tokens.slice(startIndex, endIndex);
      const start = tokens[startIndex];
      return {
        kind: start?.text === RESERVED_WORDS.workflow ? "workflow" : "data",
        tokens: chunkTokens,
        range: DeclChunk.rangeOf(chunkTokens),
      };
    });
  },
} as const;
