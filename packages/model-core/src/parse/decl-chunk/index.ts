import { RESERVED_WORDS } from "../../reserved-word";
import { SourceRange, type SourceRange as Range } from "../../source-range";
import { TOKEN_KINDS, type Token } from "../../token";

/** 宣言単位のトークンチャンク(data / workflow / 孤立)。 */
export type DeclChunk = Readonly<{
  kind: "data" | "workflow" | "orphan";
  tokens: readonly Token[];
  range: Range;
}>;

const emptyRange = (): Range => SourceRange.onLine(1, 1, 1);

const isTrivia = (token: Token): boolean =>
  token.kind === TOKEN_KINDS.comment ||
  token.kind === TOKEN_KINDS.blankLine ||
  token.kind === TOKEN_KINDS.indent;

const isSyncToken = (token: Token): boolean =>
  token.kind === TOKEN_KINDS.reserved &&
  (token.text === RESERVED_WORDS.data ||
    token.text === RESERVED_WORDS.workflow) &&
  token.range.startColumn === 1;

/**
 * 先頭の同期ポイントまでに残った意味トークンを孤立チャンクにする。
 * @param tokens 全文のトークン列。
 * @param leadingEnd 先頭チャンクの終端 index(含まない)。
 * @returns 孤立チャンク。無ければ空配列。
 */
const leadingOrphanChunks = (
  tokens: readonly Token[],
  leadingEnd: number,
): readonly DeclChunk[] => {
  const leadingTokens = tokens.slice(0, leadingEnd);
  const firstMeaningfulIndex = leadingTokens.findIndex(
    (token) => !isTrivia(token),
  );
  if (firstMeaningfulIndex === -1) {
    return [];
  }
  const orphanTokens = leadingTokens.slice(firstMeaningfulIndex);
  return [
    {
      kind: "orphan",
      tokens: orphanTokens,
      range: DeclChunk.rangeOf(orphanTokens),
    },
  ];
};

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
   * 同期ポイントより前の意味トークンは孤立チャンクにする。
   * @param tokens 全文のトークン列。
   * @returns 宣言チャンク列。
   */
  split: (tokens: readonly Token[]): readonly DeclChunk[] => {
    const syncIndexes = tokens.flatMap((token, index) =>
      isSyncToken(token) ? [index] : [],
    );
    const syncedChunks = syncIndexes.map((startIndex, order) => {
      const nextSync = syncIndexes[order + 1];
      const endIndex = nextSync === undefined ? tokens.length : nextSync;
      const chunkTokens = tokens.slice(startIndex, endIndex);
      const start = tokens[startIndex];
      return {
        kind:
          start?.text === RESERVED_WORDS.workflow
            ? ("workflow" as const)
            : ("data" as const),
        tokens: chunkTokens,
        range: DeclChunk.rangeOf(chunkTokens),
      };
    });
    const leadingEnd = syncIndexes[0] ?? tokens.length;
    return [...leadingOrphanChunks(tokens, leadingEnd), ...syncedChunks];
  },
} as const;
