import { expect, test } from "vitest";
import {
  Identifier,
  TOKEN_KINDS,
  Tokenizer,
  type Token,
} from "..";

const kindsOf = (tokens: readonly Token[]): readonly string[] =>
  tokens.map((token) => token.kind);

test("空行は blankLine トークンになる", () => {
  const tokens = Tokenizer.tokenize("data 注文 = string\n\ndata 注文ID = string");

  expect(kindsOf(tokens)).toEqual([
    TOKEN_KINDS.reserved,
    TOKEN_KINDS.identifier,
    TOKEN_KINDS.equals,
    TOKEN_KINDS.identifier,
    TOKEN_KINDS.blankLine,
    TOKEN_KINDS.reserved,
    TOKEN_KINDS.identifier,
    TOKEN_KINDS.equals,
    TOKEN_KINDS.identifier,
  ]);
  expect(tokens[4]).toEqual({
    kind: TOKEN_KINDS.blankLine,
    text: "",
    range: {
      startLine: 2,
      startColumn: 1,
      endLine: 2,
      endColumn: 1,
    },
  });
});

test("空白のみの行も blankLine になる", () => {
  const tokens = Tokenizer.tokenize("data 注文 = string\n  \ndata 注文ID = string");

  expect(tokens[4]).toEqual({
    kind: TOKEN_KINDS.blankLine,
    text: "  ",
    range: {
      startLine: 2,
      startColumn: 1,
      endLine: 2,
      endColumn: 3,
    },
  });
});

test("行頭インデントは indent トークンになる", () => {
  const tokens = Tokenizer.tokenize("data 注文 =\n  注文ID\n  AND 顧客情報");

  expect(tokens.filter((token) => token.kind === TOKEN_KINDS.indent)).toEqual([
    {
      kind: TOKEN_KINDS.indent,
      text: "  ",
      range: {
        startLine: 2,
        startColumn: 1,
        endLine: 2,
        endColumn: 3,
      },
    },
    {
      kind: TOKEN_KINDS.indent,
      text: "  ",
      range: {
        startLine: 3,
        startColumn: 1,
        endLine: 3,
        endColumn: 3,
      },
    },
  ]);
});

test("タブインデントも indent トークンになる", () => {
  const tokens = Tokenizer.tokenize("data 注文 =\n\t注文ID");

  expect(tokens[3]).toEqual({
    kind: TOKEN_KINDS.indent,
    text: "\t",
    range: {
      startLine: 2,
      startColumn: 1,
      endLine: 2,
      endColumn: 2,
    },
  });
});

test("制約の範囲は number と rangeDots に分解する", () => {
  const tokens = Tokenizer.tokenize("data 注文数量 = int constrained 1..100");

  expect(
    tokens
      .filter((token) =>
        token.kind === TOKEN_KINDS.number ||
        token.kind === TOKEN_KINDS.rangeDots
      )
      .map((token) => ({ kind: token.kind, text: token.text })),
  ).toEqual([
    { kind: TOKEN_KINDS.number, text: "1" },
    { kind: TOKEN_KINDS.rangeDots, text: ".." },
    { kind: TOKEN_KINDS.number, text: "100" },
  ]);
});

test("片側開放の範囲も number と rangeDots に分解する", () => {
  const tokens = Tokenizer.tokenize("data 下限のみ = int constrained 1..\ndata 上限のみ = int constrained ..100");

  expect(
    tokens
      .filter((token) =>
        token.kind === TOKEN_KINDS.number ||
        token.kind === TOKEN_KINDS.rangeDots
      )
      .map((token) => token.text),
  ).toEqual(["1", "..", "..", "100"]);
});

test("Identifier.isAcceptable は空文字と空白含みを拒否する", () => {
  expect(Identifier.isAcceptable("")).toBe(false);
  expect(Identifier.isAcceptable("注文 名")).toBe(false);
  expect(Identifier.isAcceptable("注文\n名")).toBe(false);
});

test("プリミティブ型名は予約語ではなく identifier になる", () => {
  const tokens = Tokenizer.tokenize("data 顧客名 = string");

  expect(tokens[3]).toEqual({
    kind: TOKEN_KINDS.identifier,
    text: "string",
    range: {
      startLine: 1,
      startColumn: 12,
      endLine: 1,
      endColumn: 18,
    },
  });
});

test("CRLF 改行でも行番号がずれない", () => {
  const tokens = Tokenizer.tokenize("data 注文 = string\r\n// 次行");

  expect(tokens[4]).toEqual({
    kind: TOKEN_KINDS.comment,
    text: "// 次行",
    range: {
      startLine: 2,
      startColumn: 1,
      endLine: 2,
      endColumn: 6,
    },
  });
});
