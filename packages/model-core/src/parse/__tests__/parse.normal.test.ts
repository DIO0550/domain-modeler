import { expect, test } from "vitest";
import { Declaration } from "../../document";
import { Parse } from "..";

test("単一参照の data 宣言を alias 型式として解析する", () => {
  const result = Parse.parse("data 注文ID = string");

  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations).toHaveLength(1);
  expect(result.document.declarations[0]).toMatchObject({
    kind: "data",
    name: "注文ID",
    typeExpr: {
      form: "alias",
      term: {
        name: "string",
        isPrimitive: true,
        modifiers: [],
        range: {
          startLine: 1,
          startColumn: 13,
          endLine: 1,
          endColumn: 19,
        },
      },
    },
  });
});

test("後置修飾 option を持つ単一参照を解析する", () => {
  const result = Parse.parse("data 割引コード = 文字列 option");

  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations[0]).toMatchObject({
    kind: "data",
    name: "割引コード",
    typeExpr: {
      form: "alias",
      term: {
        name: "文字列",
        isPrimitive: false,
        modifiers: ["option"],
      },
    },
  });
});

test("list option を重ねた後置修飾を解析する", () => {
  const result = Parse.parse("data 明細 = 注文明細 list option");

  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations[0]).toMatchObject({
    kind: "data",
    typeExpr: {
      form: "alias",
      term: { modifiers: ["list", "option"] },
    },
  });
});

test("OR 連結の data 宣言を choice 型式として解析する", () => {
  const result = Parse.parse(
    "data 注文 = 未検証の注文 OR 検証済みの注文",
  );

  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations[0]).toMatchObject({
    kind: "data",
    typeExpr: {
      form: "choice",
      terms: [{ name: "未検証の注文" }, { name: "検証済みの注文" }],
    },
  });
});

test("継続行の AND 連結と list 修飾を record 型式として解析する", () => {
  const source = `data 検証済みの注文 =
  注文ID
  AND 顧客情報
  AND 注文明細 list`;
  const result = Parse.parse(source);

  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations[0]).toMatchObject({
    kind: "data",
    name: "検証済みの注文",
    typeExpr: {
      form: "record",
      terms: [
        { name: "注文ID", modifiers: [] },
        { name: "顧客情報", modifiers: [] },
        { name: "注文明細", modifiers: ["list"] },
      ],
    },
  });
});

test("int の数値制約を value 型式として解析する", () => {
  const result = Parse.parse("data 注文数量 = int constrained 1..100");

  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations[0]).toMatchObject({
    kind: "data",
    name: "注文数量",
    typeExpr: {
      form: "value",
      primitive: "int",
      constraint: {
        kind: "numeric",
        bounds: { bound: "both", min: 1, max: 100 },
        range: {
          startLine: 1,
          startColumn: 17,
          endLine: 1,
          endColumn: 35,
        },
      },
    },
  });
});

test("string の length 制約を value 型式として解析する", () => {
  const result = Parse.parse(
    "data 顧客名 = string constrained length 1..50",
  );

  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations[0]).toMatchObject({
    kind: "data",
    name: "顧客名",
    typeExpr: {
      form: "value",
      primitive: "string",
      constraint: {
        kind: "length",
        bounds: { bound: "both", min: 1, max: 50 },
      },
    },
  });
});

test("下限のみの範囲制約を解析する", () => {
  const result = Parse.parse("data 数量 = int constrained 1..");

  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations[0]).toMatchObject({
    kind: "data",
    typeExpr: {
      form: "value",
      constraint: { bounds: { bound: "minOnly", min: 1 } },
    },
  });
});

test("上限のみの範囲制約を解析する", () => {
  const result = Parse.parse("data 数量 = int constrained ..100");

  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations[0]).toMatchObject({
    kind: "data",
    typeExpr: {
      form: "value",
      constraint: { bounds: { bound: "maxOnly", max: 100 } },
    },
  });
});

test("仕様例の data 宣言群を解析し workflow はスキップする", () => {
  const source = `// 注文ドメインのモデル

data 注文 = 未検証の注文 OR 検証済みの注文

data 検証済みの注文 =
  注文ID
  AND 顧客情報
  AND 注文明細 list

data 注文数量 = int constrained 1..100
data 顧客名 = string constrained length 1..50
data 割引コード = 文字列 option

workflow 注文を確定する =
  input: 未検証の注文 AND 在庫状況
  output: 注文確定イベント OR 注文保留イベント
  error: 検証エラー
`;
  const result = Parse.parse(source);

  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations).toHaveLength(5);
  expect(
    result.document.declarations.every((decl) => Declaration.isData(decl)),
  ).toBe(true);
  expect(
    result.document.declarations.map((decl) =>
      "name" in decl ? decl.name : "",
    ),
  ).toEqual([
    "注文",
    "検証済みの注文",
    "注文数量",
    "顧客名",
    "割引コード",
  ]);
  expect(result.tokens.length).toBeGreaterThan(0);
});
