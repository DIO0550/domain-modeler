import { expect, test } from "vitest";
import { AnalyzedModel } from "..";

test("空文書は診断も未定義名も無い", () => {
  const analyzed = AnalyzedModel.from("");

  expect(analyzed.diagnostics).toEqual([]);
  expect(analyzed.undefinedTypeNames).toEqual(new Set());
  expect(analyzed.document.declarations).toEqual([]);
});

test("プリミティブ型は未定義名に含めない", () => {
  const analyzed = AnalyzedModel.from("data 名前 = string");

  expect(analyzed.undefinedTypeNames).toEqual(new Set());
});

test("同じ未定義名が複数箇所にあっても名前は1つにまとめる", () => {
  const analyzed = AnalyzedModel.from(`data 注文 = 顧客情報
data 配送 = 顧客情報 option`);

  expect(analyzed.undefinedTypeNames).toEqual(new Set(["顧客情報"]));
  expect(
    analyzed.diagnostics.filter((diagnostic) => diagnostic.severity === "warning"),
  ).toHaveLength(2);
});

test("再宣言エラーは未定義警告と同時に残る", () => {
  const analyzed = AnalyzedModel.from(`data 注文ID = string
data 注文ID = 未定義型`);

  expect(analyzed.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "「注文ID」は既に宣言されています",
    }),
    expect.objectContaining({
      severity: "warning",
      message: "「未定義型」は未定義です",
    }),
  ]);
  expect(analyzed.undefinedTypeNames).toEqual(new Set(["未定義型"]));
});
