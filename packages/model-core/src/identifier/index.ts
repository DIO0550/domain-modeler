import { ReservedWord } from "../reserved-word";

/** 識別子として使える文字列かを判定する関数群。 */
export const Identifier = {
  /**
   * 予約語・空・空白含みを拒否し、識別子として使えるか判定する。
   * @param text 判定する文字列。
   * @returns 識別子として使える場合は `true`。
   */
  isAcceptable: (text: string): boolean => {
    if (text.length === 0) {
      return false;
    }
    if (/\s/u.test(text)) {
      return false;
    }
    return !ReservedWord.is(text);
  },
} as const;
