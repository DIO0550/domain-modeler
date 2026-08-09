import type { ValueOf } from "../types/value-of";

/** 予約語の列挙値(model-format.md §3)。 */
export const RESERVED_WORDS = {
  data: "data",
  workflow: "workflow",
  AND: "AND",
  OR: "OR",
  list: "list",
  option: "option",
  constrained: "constrained",
  length: "length",
  "input:": "input:",
  "output:": "output:",
  "error:": "error:",
} as const;

/** 予約語。 */
export type ReservedWord = ValueOf<typeof RESERVED_WORDS>;

/**
 * 空白・`=`・`.`・`/`・`:` で区切られる先頭語の長さを返す。
 * @param text 走査開始位置からの部分文字列。
 * @returns 先頭語の文字数。
 */
const leadingWordLength = (text: string): number => {
  const matched = /^[^\s=./:]+/u.exec(text);
  return matched === null ? 0 : matched[0].length;
};

/** 予約語を判定・照合する関数群。 */
export const ReservedWord = {
  /**
   * 値が予約語か判定する。
   * @param value 判定する値。
   * @returns 予約語の場合は `true`。
   */
  is: (value: string): value is ReservedWord => value in RESERVED_WORDS,
  /**
   * 先頭から予約語として最長一致する文字数を返す。一致しなければ 0。
   * `input:` / `output:` / `error:` はコロン込みで照合する。
   * @param text 走査開始位置からの部分文字列。
   * @returns 予約語として一致した文字数。
   */
  matchedLength: (text: string): number => {
    const wordLength = leadingWordLength(text);
    if (wordLength > 0 && text[wordLength] === ":") {
      const candidate = text.slice(0, wordLength + 1);
      if (candidate in RESERVED_WORDS) {
        return wordLength + 1;
      }
    }
    const withoutColon = text.slice(0, wordLength);
    if (withoutColon in RESERVED_WORDS) {
      return wordLength;
    }
    return 0;
  },
} as const;
