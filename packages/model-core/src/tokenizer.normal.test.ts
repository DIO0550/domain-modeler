import { expect, test } from "vitest";
import {
  Identifier,
  ReservedWord,
  TOKEN_KINDS,
  Tokenizer,
  type Token,
} from "./tokenizer";

const kindsOf = (tokens: readonly Token[]): readonly string[] =>
  tokens.map((token) => token.kind);

const textsOf = (tokens: readonly Token[]): readonly string[] =>
  tokens.map((token) => token.text);

test("日本語識別子を identifier トークンとして分解する", () => {
  const tokens = Tokenizer.tokenize("data 注文 = 未検証の注文");

  expect(textsOf(tokens)).toEqual([
    "data",
    "注文",
    "=",
    "未検証の注文",
  ]);
  expect(kindsOf(tokens)).toEqual([
    TOKEN_KINDS.reserved,
    TOKEN_KINDS.identifier,
    TOKEN_KINDS.equals,
    TOKEN_KINDS.identifier,
  ]);
});

test("英数字混在の日本語識別子も identifier になる", () => {
  const tokens = Tokenizer.tokenize("data 注文ID = string");

  expect(tokens[1]).toEqual({
    kind: TOKEN_KINDS.identifier,
    text: "注文ID",
    range: {
      startLine: 1,
      startColumn: 6,
      endLine: 1,
      endColumn: 10,
    },
  });
});

test("行頭コメントの位置情報がソース上の範囲と一致する", () => {
  const tokens = Tokenizer.tokenize("// 注文ドメインのモデル");

  expect(tokens).toEqual([
    {
      kind: TOKEN_KINDS.comment,
      text: "// 注文ドメインのモデル",
      range: {
        startLine: 1,
        startColumn: 1,
        endLine: 1,
        endColumn: 14,
      },
    },
  ]);
});

test("行中コメントの位置情報が直前トークンの後ろから行末までになる", () => {
  const tokens = Tokenizer.tokenize("注文保留イベント // 在庫不足");

  expect(tokens).toEqual([
    {
      kind: TOKEN_KINDS.identifier,
      text: "注文保留イベント",
      range: {
        startLine: 1,
        startColumn: 1,
        endLine: 1,
        endColumn: 9,
      },
    },
    {
      kind: TOKEN_KINDS.comment,
      text: "// 在庫不足",
      range: {
        startLine: 1,
        startColumn: 10,
        endLine: 1,
        endColumn: 17,
      },
    },
  ]);
});

test("予約語は identifier ではなく reserved になる", () => {
  const tokens = Tokenizer.tokenize(
    "workflow 注文を確定する =\n  input: 未検証の注文 AND 在庫状況",
  );

  expect(
    tokens.filter((token) => token.kind === TOKEN_KINDS.reserved).map(
      (token) => token.text,
    ),
  ).toEqual(["workflow", "input:", "AND"]);
  expect(
    tokens.some(
      (token) =>
        token.kind === TOKEN_KINDS.identifier &&
        ReservedWord.is(token.text),
    ),
  ).toBe(false);
});

test("Identifier.isAcceptable は予約語を拒否する", () => {
  expect(Identifier.isAcceptable("data")).toBe(false);
  expect(Identifier.isAcceptable("workflow")).toBe(false);
  expect(Identifier.isAcceptable("input:")).toBe(false);
  expect(Identifier.isAcceptable("注文")).toBe(true);
});
