import { ReservedWord } from "../reserved-word";
import { TOKEN_KINDS, Token, type Token as DslToken } from "../token";

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
 * 空行・空白のみの行を blankLine トークンにする。
 * @param line 行内容。
 * @param lineNumber 行番号。
 * @returns blankLine トークン。
 */
const tokenizeBlankLine = (line: string, lineNumber: number): DslToken =>
  Token.create(TOKEN_KINDS.blankLine, line, lineNumber, 1);

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
): readonly DslToken[] => {
  const tokens: DslToken[] = [];
  let column = startColumn;

  while (column <= line.length) {
    const offset = column - 1;
    const rest = line.slice(offset);

    if (rest.startsWith("//")) {
      tokens.push(Token.create(TOKEN_KINDS.comment, rest, lineNumber, column));
      break;
    }

    if (rest.startsWith("=")) {
      tokens.push(Token.create(TOKEN_KINDS.equals, "=", lineNumber, column));
      column += 1;
      continue;
    }

    if (rest.startsWith("..")) {
      tokens.push(
        Token.create(TOKEN_KINDS.rangeDots, "..", lineNumber, column),
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
      tokens.push(Token.create(TOKEN_KINDS.number, text, lineNumber, column));
      column += digits;
      continue;
    }

    const reservedLength = ReservedWord.matchedLength(rest);
    if (reservedLength > 0) {
      const text = rest.slice(0, reservedLength);
      tokens.push(
        Token.create(TOKEN_KINDS.reserved, text, lineNumber, column),
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
      Token.create(TOKEN_KINDS.identifier, text, lineNumber, column),
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
): readonly DslToken[] => {
  const indentLength = leadingWhitespaceLength(line);
  const content = line.slice(indentLength);

  if (content.length === 0) {
    return [tokenizeBlankLine(line, lineNumber)];
  }

  const tokens: DslToken[] = [];
  if (indentLength > 0) {
    tokens.push(
      Token.create(
        TOKEN_KINDS.indent,
        line.slice(0, indentLength),
        lineNumber,
        1,
      ),
    );
  }
  tokens.push(...tokenizeLineContent(line, lineNumber, indentLength + 1));
  return tokens;
};

/** `.dmodel` テキストをトークン列へ分解する。 */
export const Tokenizer = {
  /**
   * ソース全文をトークン列に分解する。例外は投げない。
   * @param source `.dmodel` テキスト。
   * @returns 出現順のトークン列。
   */
  tokenize: (source: string): readonly DslToken[] => {
    const lines = source.split("\n").map(stripTrailingCr);
    return lines.flatMap((line, index) => tokenizeLine(line, index + 1));
  },
} as const;
