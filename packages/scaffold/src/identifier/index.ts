import {
  Identifier as DslIdentifier,
  ReservedWord,
} from "@domain-modeler/model-core";
import { Option, type Option as OptionType } from "../option";

/** 空白・改行の置換および予約語回避に使う区切り文字。 */
const UNDERSCORE = "_";

/**
 * 空白・改行をアンダースコアに置換する。
 * @param text 付箋テキスト。
 * @returns 空白を置換した文字列。
 */
const replaceWhitespace = (text: string): string =>
  text.replace(/\s/gu, UNDERSCORE);

/**
 * 予約語と一致する場合はアンダースコアを付けて識別子にする。
 * `input:` などコロンで終わる予約語は、末尾に `_` を付けるとトークナイザが
 * 先頭の予約語を優先するため、コロンの直前へ `_` を入れる。
 * @param text 空白置換後の文字列。
 * @returns 識別子として使える文字列。
 */
const avoidReservedWord = (text: string): string => {
  if (!ReservedWord.is(text)) {
    return text;
  }
  if (text.endsWith(":")) {
    return `${text.slice(0, -1)}${UNDERSCORE}:`;
  }
  return `${text}${UNDERSCORE}`;
};

/** 付箋テキストを `.dmodel` の識別子へ変換する関数群。 */
export const Identifier = {
  /**
   * 付箋テキストを識別子化する。空文字と、識別子として使えない文字列は変換対象外。
   * @param text 付箋テキスト。
   * @returns 識別子。変換できない場合は値なし。
   */
  create: (text: string): OptionType<string> => {
    if (text.length === 0) {
      return Option.none();
    }
    const identifier = avoidReservedWord(replaceWhitespace(text));
    if (!DslIdentifier.isAcceptable(identifier)) {
      return Option.none();
    }
    return Option.some(identifier);
  },
  /**
   * 付箋テキスト列を識別子化する。空文字は除き、同一テキストは先出順で1つに統合する。
   * @param texts 付箋テキスト列。
   * @returns 識別子列。
   */
  unify: (texts: readonly string[]): readonly string[] =>
    [...new Set(texts)].flatMap((text) => {
      const identifier = Identifier.create(text);
      if (Option.isNone(identifier)) {
        return [];
      }
      return [identifier.value];
    }),
} as const;
