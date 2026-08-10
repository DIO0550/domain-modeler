import { expect, test } from "vitest";
import { Tokenizer } from "../../../tokenizer";
import { DeclChunk } from "..";

test("空のトークン列の rangeOf は 1:1 の空範囲になる", () => {
  expect(DeclChunk.rangeOf([])).toEqual({
    startLine: 1,
    startColumn: 1,
    endLine: 1,
    endColumn: 1,
  });
});

test("トークン列の先頭から末尾までの範囲を rangeOf で返す", () => {
  const tokens = Tokenizer.tokenize("data 注文 = string");
  expect(DeclChunk.rangeOf(tokens)).toEqual({
    startLine: 1,
    startColumn: 1,
    endLine: 1,
    endColumn: 17,
  });
});

test("data と workflow を同期ポイントとしてチャンク分割する", () => {
  const tokens = Tokenizer.tokenize(`data 注文ID = string
workflow 確定する =
  input: 注文
`);
  const chunks = DeclChunk.split(tokens);

  expect(chunks).toHaveLength(2);
  expect(chunks[0]).toMatchObject({ kind: "data" });
  expect(chunks[1]).toMatchObject({ kind: "workflow" });
  expect(chunks[0]?.tokens.map((token) => token.text)).toEqual([
    "data",
    "注文ID",
    "=",
    "string",
  ]);
  expect(chunks[1]?.tokens[0]).toMatchObject({ text: "workflow" });
});

test("継続行は直前の宣言チャンクに含める", () => {
  const tokens = Tokenizer.tokenize(`data 注文 =
  注文ID
  AND 顧客情報
`);
  const chunks = DeclChunk.split(tokens);

  expect(chunks).toHaveLength(1);
  expect(chunks[0]).toMatchObject({ kind: "data" });
  expect(chunks[0]?.tokens.map((token) => token.text)).toContain("AND");
  expect(chunks[0]?.tokens.map((token) => token.text)).toContain("顧客情報");
});

test("宣言が無いソースは空のチャンク列になる", () => {
  const tokens = Tokenizer.tokenize("// コメントだけ\n\n");
  expect(DeclChunk.split(tokens)).toEqual([]);
});
