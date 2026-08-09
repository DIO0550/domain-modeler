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

/** 予約語を判定する関数群。 */
export const ReservedWord = {
  /**
   * 値が予約語か判定する。
   * @param value 判定する値。
   * @returns 予約語の場合は `true`。
   */
  is: (value: string): value is ReservedWord => value in RESERVED_WORDS,
} as const;

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

/**
 * 行末の CR を除く(CRLF 入力への耐性)。
 * @param line 1行分の文字列。
 * @returns LF 前提の行文字列。
 */
const stripTrailingCr = (line: string): string =>
  line.endsWith("\r") ? line.slice(0, -1) : line;

/**
 * 行頭の空白(スペース・タブ)の長さを返す。
 * @param line 対象行。
 * @returns 先頭空白の文字数。
 */
const leadingWhitespaceLength = (line: string): number => {
  const matched = /^[ \t]*/u.exec(line);
  return matched === null ? 0 : matched[0].length;
};

/**
 * 数字列の長さを返す。先頭が数字でない場合は 0。
 * @param text 走査開始位置からの部分文字列。
 * @returns 連続する数字の文字数。
 */
const numberLength = (text: string): number => {
  const matched = /^\d+/u.exec(text);
  return matched === null ? 0 : matched[0].length;
};

/**
 * 識別子候補の長さを返す。空白・`=`・`.`・`/` で区切る。
 * @param text 走査開始位置からの部分文字列。
 * @returns 識別子候補の文字数。
 */
const wordLength = (text: string): number => {
  const matched = /^[^\s=./]+/u.exec(text);
  return matched === null ? 0 : matched[0].length;
};

/**
 * 予約語(コロン付きを含む)として最長一致する長さを返す。
 * @param text 走査開始位置からの部分文字列。
 * @returns 予約語として一致した文字数。一致しなければ 0。
 */
const reservedWordLength = (text: string): number => {
  const withColon = wordLength(text);
  if (withColon > 0 && text[withColon] === ":") {
    const candidate = text.slice(0, withColon + 1);
    if (ReservedWord.is(candidate)) {
      return withColon + 1;
    }
  }
  const withoutColon = text.slice(0, withColon);
  if (ReservedWord.is(withoutColon)) {
    return withColon;
  }
  return 0;
};

/**
 * 1トークンを生成する。
 * @param kind トークン種別。
 * @param text トークン文字列。
 * @param line 行番号。
 * @param startColumn 開始桁。
 * @returns トークン。
 */
const createToken = (
  kind: TokenKind,
  text: string,
  line: number,
  startColumn: number,
): Token => ({
  kind,
  text,
  range: SourceRange.onLine(line, startColumn, startColumn + text.length),
});

/**
 * 空行・空白のみの行を blankLine トークンにする。
 * @param line 行内容。
 * @param lineNumber 行番号。
 * @returns blankLine トークン。
 */
const tokenizeBlankLine = (line: string, lineNumber: number): Token =>
  createToken(TOKEN_KINDS.blankLine, line, lineNumber, 1);

/**
 * 行頭以降の内容をトークン列にする。
 * @param line 対象行。
 * @param lineNumber 行番号。
 * @param startColumn 走査開始桁。
 * @returns その行のトークン列。
 */
const tokenizeLineContent = (
  line: string,
  lineNumber: number,
  startColumn: number,
): readonly Token[] => {
  const tokens: Token[] = [];
  let column = startColumn;

  while (column <= line.length) {
    const offset = column - 1;
    const rest = line.slice(offset);

    if (rest.startsWith("//")) {
      tokens.push(
        createToken(TOKEN_KINDS.comment, rest, lineNumber, column),
      );
      break;
    }

    if (rest.startsWith("=")) {
      tokens.push(createToken(TOKEN_KINDS.equals, "=", lineNumber, column));
      column += 1;
      continue;
    }

    if (rest.startsWith("..")) {
      tokens.push(
        createToken(TOKEN_KINDS.rangeDots, "..", lineNumber, column),
      );
      column += 2;
      continue;
    }

    if (rest[0] === " " || rest[0] === "\t") {
      column += 1;
      continue;
    }

    const digits = numberLength(rest);
    if (digits > 0) {
      const text = rest.slice(0, digits);
      tokens.push(createToken(TOKEN_KINDS.number, text, lineNumber, column));
      column += digits;
      continue;
    }

    const reservedLength = reservedWordLength(rest);
    if (reservedLength > 0) {
      const text = rest.slice(0, reservedLength);
      tokens.push(
        createToken(TOKEN_KINDS.reserved, text, lineNumber, column),
      );
      column += reservedLength;
      continue;
    }

    const length = wordLength(rest);
    if (length === 0) {
      // 想定外の1文字は読み飛ばして解析を止めない
      column += 1;
      continue;
    }

    const text = rest.slice(0, length);
    tokens.push(
      createToken(TOKEN_KINDS.identifier, text, lineNumber, column),
    );
    column += length;
  }

  return tokens;
};

/**
 * 1行をトークン列にする。
 * @param line 行内容(改行なし)。
 * @param lineNumber 行番号(1始まり)。
 * @returns その行のトークン列。
 */
const tokenizeLine = (
  line: string,
  lineNumber: number,
): readonly Token[] => {
  const indentLength = leadingWhitespaceLength(line);
  const content = line.slice(indentLength);

  if (content.length === 0) {
    return [tokenizeBlankLine(line, lineNumber)];
  }

  const tokens: Token[] = [];
  if (indentLength > 0) {
    tokens.push(
      createToken(
        TOKEN_KINDS.indent,
        line.slice(0, indentLength),
        lineNumber,
        1,
      ),
    );
  }
  tokens.push(
    ...tokenizeLineContent(line, lineNumber, indentLength + 1),
  );
  return tokens;
};

/** `.dmodel` テキストをトークン列へ分解する。 */
export const Tokenizer = {
  /**
   * ソース全文をトークン列に分解する。例外は投げない。
   * @param source `.dmodel` テキスト。
   * @returns 出現順のトークン列。
   */
  tokenize: (source: string): readonly Token[] => {
    const lines = source.split("\n").map(stripTrailingCr);
    return lines.flatMap((line, index) => tokenizeLine(line, index + 1));
  },
} as const;
