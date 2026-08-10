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

test("型式エラーのとき ErrorDecl と診断を返す", () => {
  expect(materialize("data 数量 = int constrained 10..1")).toMatchObject({
    declaration: { kind: "error" },
    diagnostics: [
      {
        severity: "error",
        message: "範囲の下限が上限を超えています",
      },
    ],
  });
});

test("名前が欠けると ErrorDecl と診断を返す", () => {
  expect(materialize("data = string")).toMatchObject({
    declaration: { kind: "error" },
    diagnostics: [
      expect.objectContaining({
        severity: "error",
        message: "データ名の識別子が必要です",
      }),
    ],
  });
});

test("型式の後に余分なトークンがあると ErrorDecl になる", () => {
  expect(materialize("data 注文 = string AND")).toMatchObject({
    declaration: { kind: "error" },
    diagnostics: [
      expect.objectContaining({
        severity: "error",
        message: "型参照が必要です",
      }),
    ],
  });
});
