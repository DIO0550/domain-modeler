import { TOKEN_KINDS, type Token } from "../../token";

const isTrivia = (token: Token): boolean =>
  token.kind === TOKEN_KINDS.comment ||
  token.kind === TOKEN_KINDS.blankLine ||
  token.kind === TOKEN_KINDS.indent;

/** チャンク内カーソル。trivia を読み飛ばしながら走査する。 */
export class ChunkCursor {
  #index = 0;

  constructor(readonly tokens: readonly Token[]) {}

  /** 残りに意味トークンが無いか。 */
  get atEnd(): boolean {
    this.#skipTrivia();
    return this.#index >= this.tokens.length;
  }

  /** 次の意味トークンを返す(進めない)。 */
  peek(): Token | undefined {
    this.#skipTrivia();
    return this.tokens[this.#index];
  }

  /**
   * 現在位置から n 個先の意味トークンを返す(0 が peek と同じ)。
   * @param offset 先読み個数。
   * @returns 意味トークン。無ければ undefined。
   */
  peekAt(offset: number): Token | undefined {
    this.#skipTrivia();
    let seen = 0;
    for (let index = this.#index; index < this.tokens.length; index += 1) {
      const token = this.tokens[index];
      if (token === undefined || isTrivia(token)) {
        continue;
      }
      if (seen === offset) {
        return token;
      }
      seen += 1;
    }
    return undefined;
  }

  /** 次の意味トークンを消費して返す。 */
  advance(): Token | undefined {
    this.#skipTrivia();
    const token = this.tokens[this.#index];
    if (token !== undefined) {
      this.#index += 1;
    }
    return token;
  }

  #skipTrivia(): void {
    while (this.#index < this.tokens.length) {
      const token = this.tokens[this.#index];
      if (token === undefined || !isTrivia(token)) {
        return;
      }
      this.#index += 1;
    }
  }
}
