import { TOKEN_KINDS } from "../token";
import { Tokenizer } from "../tokenizer";

/** 識別子として使える文字列かを判定する関数群。 */
export const Identifier = {
  /**
   * トークナイザが識別子1トークンとして出す文字列かを判定する。
   * 予約語・空・空白・数字・`=` `.` `/` を含む値は拒否する。
   * @param text 判定する文字列。
   * @returns 識別子として使える場合は `true`。
   */
  isAcceptable: (text: string): boolean => {
    const tokens = Tokenizer.tokenize(text);
    const [token] = tokens;
    return (
      tokens.length === 1 &&
      token !== undefined &&
      token.kind === TOKEN_KINDS.identifier &&
      token.text === text
    );
  },
} as const;
