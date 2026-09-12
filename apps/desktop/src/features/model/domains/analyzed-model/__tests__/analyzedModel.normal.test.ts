import { expect, test } from "vitest";
import { Declaration } from "@domain-modeler/model-core";
import { AnalyzedModel } from "..";

test("正しい文書は診断が空になる", () => {
  const analyzed = AnalyzedModel.create("data 注文ID = string");

  expect(analyzed.diagnostics).toEqual([]);
  expect(analyzed.undefinedTypeNames).toEqual(new Set());
  expect(analyzed.document.declarations).toHaveLength(1);
});

test("パースエラーと未定義警告をまとめて返す", () => {
  const source = `data 数量 = int constrained 10..1
data 注文 = 未定義型`;
  const analyzed = AnalyzedModel.create(source);

  expect(analyzed.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "範囲の下限が上限を超えています",
    }),
    expect.objectContaining({
      severity: "warning",
      message: "「未定義型」は未定義です",
    }),
  ]);
  expect(analyzed.undefinedTypeNames).toEqual(new Set(["未定義型"]));
});

test("前方参照は未定義警告にしない", () => {
  const analyzed = AnalyzedModel.create(`data 注文 = 注文ID
data 注文ID = string`);

  expect(analyzed.diagnostics).toEqual([]);
  expect(analyzed.undefinedTypeNames).toEqual(new Set());
});

test("パースエラーがあっても文書とトークンを返す", () => {
  const analyzed = AnalyzedModel.create("data 注文 =");

  expect(analyzed.diagnostics.length).toBeGreaterThan(0);
  expect(analyzed.diagnostics.every((diagnostic) => diagnostic.severity === "error")).toBe(
    true,
  );
  expect(analyzed.document.declarations.some(Declaration.isError)).toBe(true);
  expect(analyzed.tokens.length).toBeGreaterThan(0);
});
