import { expect, test } from "vitest";
import { Tokenizer } from "../../../tokenizer";
import { ChunkCursor } from "../../chunk-cursor";
import { DeclChunk } from "../../decl-chunk";
import { TypeExprParse } from "..";

const parseTypeExpr = (source: string) => {
  const tokens = Tokenizer.tokenize(source);
  const cursor = ChunkCursor.create(tokens);
  const chunk: DeclChunk = {
    kind: "data",
    tokens,
    range: DeclChunk.rangeOf(tokens),
  };
  return TypeExprParse.parse(cursor, chunk);
};

test("単一参照を alias 型式として解析する", () => {
  expect(parseTypeExpr("string")).toMatchObject({
    ok: true,
    value: {
      value: {
        form: "alias",
        term: { name: "string", isPrimitive: true, modifiers: [] },
      },
    },
  });
});

test("後置修飾付きの単一参照を解析する", () => {
  expect(parseTypeExpr("注文明細 list option")).toMatchObject({
    ok: true,
    value: {
      value: {
        form: "alias",
        term: {
          name: "注文明細",
          isPrimitive: false,
          modifiers: ["list", "option"],
        },
      },
    },
  });
});

test("AND 連結を record 型式として解析する", () => {
  expect(parseTypeExpr("注文ID AND 顧客情報")).toMatchObject({
    ok: true,
    value: {
      value: {
        form: "record",
        terms: [{ name: "注文ID" }, { name: "顧客情報" }],
      },
    },
  });
});

test("OR 連結を choice 型式として解析する", () => {
  expect(parseTypeExpr("未検証の注文 OR 検証済みの注文")).toMatchObject({
    ok: true,
    value: {
      value: {
        form: "choice",
        terms: [{ name: "未検証の注文" }, { name: "検証済みの注文" }],
      },
    },
  });
});

test("int の数値制約を value 型式として解析する", () => {
  expect(parseTypeExpr("int constrained 1..100")).toMatchObject({
    ok: true,
    value: {
      value: {
        form: "value",
        primitive: "int",
        constraint: {
          kind: "numeric",
          bounds: { bound: "both", min: 1, max: 100 },
        },
      },
    },
  });
});

test("string の length 制約を value 型式として解析する", () => {
  expect(parseTypeExpr("string constrained length 1..50")).toMatchObject({
    ok: true,
    value: {
      value: {
        form: "value",
        primitive: "string",
        constraint: {
          kind: "length",
          bounds: { bound: "both", min: 1, max: 50 },
        },
      },
    },
  });
});

test("下限のみ・上限のみの範囲制約を解析する", () => {
  expect(parseTypeExpr("int constrained 1..")).toMatchObject({
    ok: true,
    value: {
      value: {
        form: "value",
        constraint: { bounds: { bound: "minOnly", min: 1 } },
      },
    },
  });
  expect(parseTypeExpr("decimal constrained ..100")).toMatchObject({
    ok: true,
    value: {
      value: {
        form: "value",
        constraint: { bounds: { bound: "maxOnly", max: 100 } },
      },
    },
  });
});
