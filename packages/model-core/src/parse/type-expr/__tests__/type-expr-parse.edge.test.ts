import { expect, test } from "vitest";
import { Tokenizer } from "../../../tokenizer";
import { ChunkCursor } from "../../chunk-cursor";
import { DeclChunk } from "../../decl-chunk";
import { TypeExprParse } from "..";

const parseTypeExpr = (source: string) => {
  const tokens = Tokenizer.tokenize(source);
  const cursor = new ChunkCursor(tokens);
  const chunk: DeclChunk = {
    kind: "data",
    tokens,
    range: DeclChunk.rangeOf(tokens),
  };
  return TypeExprParse.parse(cursor, chunk);
};

test("AND と OR の混在はエラーになる", () => {
  expect(parseTypeExpr("注文ID AND 顧客情報 OR 状態")).toMatchObject({
    ok: false,
    error: {
      severity: "error",
      message: "AND と OR を同じ宣言内で混在させることはできません",
    },
  });
});

test("範囲の下限が上限を超えるとエラーになる", () => {
  expect(parseTypeExpr("int constrained 100..1")).toMatchObject({
    ok: false,
    error: {
      severity: "error",
      message: "範囲の下限が上限を超えています",
    },
  });
});

test("bool への制約はエラーになる", () => {
  expect(parseTypeExpr("bool constrained 0..1")).toMatchObject({
    ok: false,
    error: {
      severity: "error",
      message: "bool 型に制約を付けることはできません",
    },
  });
});

test("date への制約はエラーになる", () => {
  expect(parseTypeExpr("date constrained 1..31")).toMatchObject({
    ok: false,
    error: {
      severity: "error",
      message: "date 型に制約を付けることはできません",
    },
  });
});

test("string 制約に length が無いとエラーになる", () => {
  expect(parseTypeExpr("string constrained 1..50")).toMatchObject({
    ok: false,
    error: {
      severity: "error",
      message: "string 型の制約には length が必要です",
    },
  });
});

test("int 制約に length があるとエラーになる", () => {
  expect(parseTypeExpr("int constrained length 1..50")).toMatchObject({
    ok: false,
    error: {
      severity: "error",
      message: "int 型の制約に length は使えません",
    },
  });
});
