import { TOKEN_KINDS, type Token } from "../../token";

/** チャンク内カーソル。trivia を読み飛ばしながら走査する。 */
export type ChunkCursor = Readonly<{
  tokens: readonly Token[];
  index: number;
}>;

/** カーソルと値の対。消費後の位置を呼び出し側へ返すために使う。 */
export type WithCursor<T> = Readonly<{
  cursor: ChunkCursor;
  value: T;
}>;

const isTrivia = (token: Token): boolean =>
  token.kind === TOKEN_KINDS.comment ||
  token.kind === TOKEN_KINDS.blankLine ||
  token.kind === TOKEN_KINDS.indent;

/**
 * 指定位置から trivia を読み飛ばした index を返す。
 * @param tokens トークン列。
 * @param startIndex 開始 index。
 * @returns trivia 直後の index。
 */
const skipTrivia = (
  tokens: readonly Token[],
  startIndex: number,
): number => {
  let index = startIndex;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined || !isTrivia(token)) {
      return index;
    }
    index += 1;
  }
  return index;
};

/** チャンクカーソルを生成・走査する関数群。 */
export const ChunkCursor = {
  /**
   * トークン列の先頭からカーソルを生成する。
   * @param tokens チャンク内トークン列。
   * @returns カーソル。
   */
  create: (tokens: readonly Token[]): ChunkCursor => ({
    tokens,
    index: 0,
  }),

  /**
   * 残りに意味トークンが無いか判定する。
   * @param cursor カーソル。
   * @returns 意味トークンが無ければ `true`。
   */
  atEnd: (cursor: ChunkCursor): boolean => {
    const index = skipTrivia(cursor.tokens, cursor.index);
    return index >= cursor.tokens.length;
  },

  /**
   * 次の意味トークンを返す(進めない)。
   * @param cursor カーソル。
   * @returns 意味トークン。無ければ undefined。
   */
  peek: (cursor: ChunkCursor): Token | undefined => {
    const index = skipTrivia(cursor.tokens, cursor.index);
    return cursor.tokens[index];
  },

  /**
   * 現在位置から n 個先の意味トークンを返す(0 が peek と同じ)。
   * @param cursor カーソル。
   * @param offset 先読み個数。
   * @returns 意味トークン。無ければ undefined。
   */
  peekAt: (cursor: ChunkCursor, offset: number): Token | undefined => {
    const startIndex = skipTrivia(cursor.tokens, cursor.index);
    let seen = 0;
    for (let index = startIndex; index < cursor.tokens.length; index += 1) {
      const token = cursor.tokens[index];
      if (token === undefined || isTrivia(token)) {
        continue;
      }
      if (seen === offset) {
        return token;
      }
      seen += 1;
    }
    return undefined;
  },

  /**
   * 次の意味トークンを消費した新しいカーソルを返す。
   * @param cursor カーソル。
   * @returns 消費後カーソルと、消費したトークン。
   */
  advance: (
    cursor: ChunkCursor,
  ): Readonly<{ cursor: ChunkCursor; token: Token | undefined }> => {
    const index = skipTrivia(cursor.tokens, cursor.index);
    const token = cursor.tokens[index];
    if (token === undefined) {
      return {
        cursor: { tokens: cursor.tokens, index },
        token: undefined,
      };
    }
    return {
      cursor: { tokens: cursor.tokens, index: index + 1 },
      token,
    };
  },
} as const;
