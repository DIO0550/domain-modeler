import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "..";

test("空文書は診断も未定義名も無い", () => {
  const analyzed = AnalyzedModel.create("");

  expect(analyzed.diagnostics).toEqual([]);
  expect(analyzed.undefinedTypeNames).toEqual(new Set());
  expect(analyzed.document.declarations).toEqual([]);
});

test("プリミティブ型は未定義名に含めない", () => {
  const analyzed = AnalyzedModel.create("data 名前 = string");

  expect(analyzed.undefinedTypeNames).toEqual(new Set());
});

test("同じ未定義名が複数箇所にあっても名前は1つにまとめる", () => {
  const analyzed = AnalyzedModel.create(`data 注文 = 顧客情報
data 配送 = 顧客情報 option`);

  expect(analyzed.undefinedTypeNames).toEqual(new Set(["顧客情報"]));
  expect(
    analyzed.diagnostics.filter((diagnostic) => diagnostic.severity === "warning"),
  ).toHaveLength(2);
});

test("再宣言エラーは未定義警告と同時に残る", () => {
  const analyzed = AnalyzedModel.create(`data 注文ID = string
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

test("未定義の型名はジャンプ先が無い", () => {
  const analyzed = AnalyzedModel.create("data 注文 = 未定義型");

  expect(AnalyzedModel.caretOfDefinition(analyzed, "未定義型")).toEqual(
    Option.none(),
  );
});

test("プリミティブ型名はジャンプ先が無い", () => {
  const analyzed = AnalyzedModel.create("data 注文ID = string");

  expect(AnalyzedModel.caretOfDefinition(analyzed, "string")).toEqual(
    Option.none(),
  );
});

test("同名が複数あるときは先頭の定義へジャンプする", () => {
  const analyzed = AnalyzedModel.create(`data 注文ID = string
data 注文ID = int`);

  expect(AnalyzedModel.caretOfDefinition(analyzed, "注文ID")).toEqual(
    Option.some({ offset: 0, line: 1 }),
  );
});
