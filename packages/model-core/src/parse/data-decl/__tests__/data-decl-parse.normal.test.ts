import { expect, test } from "vitest";
import { Tokenizer } from "../../../tokenizer";
import { DeclChunk } from "../../decl-chunk";
import { DataDeclParse } from "..";

const materialize = (source: string) => {
  const chunks = DeclChunk.split(Tokenizer.tokenize(source));
  expect(chunks).toHaveLength(1);
  expect(chunks[0]).toEqual(expect.objectContaining({ kind: "data" }));
  return DataDeclParse.materialize(chunks[0]!);
};

test("正しい data 宣言を DataDecl に変換する", () => {
  expect(materialize("data 注文ID = string")).toMatchObject({
    declaration: {
      kind: "data",
      name: "注文ID",
      typeExpr: {
        form: "alias",
        term: { name: "string", isPrimitive: true },
      },
    },
    diagnostics: [],
  });
});

test("制約付き data 宣言を VALUE 型式の DataDecl に変換する", () => {
  expect(materialize("data 注文数量 = int constrained 1..100")).toMatchObject({
    declaration: {
      kind: "data",
      name: "注文数量",
      typeExpr: {
        form: "value",
        primitive: "int",
        constraint: {
          kind: "numeric",
          bounds: { bound: "both", min: 1, max: 100 },
        },
      },
    },
    diagnostics: [],
  });
});

test("継続行の AND 連結を RECORD 型式の DataDecl に変換する", () => {
  const source = `data 検証済みの注文 =
  注文ID
  AND 顧客情報`;
  expect(materialize(source)).toMatchObject({
    declaration: {
      kind: "data",
      name: "検証済みの注文",
      typeExpr: {
        form: "record",
        terms: [{ name: "注文ID" }, { name: "顧客情報" }],
      },
    },
    diagnostics: [],
  });
});
