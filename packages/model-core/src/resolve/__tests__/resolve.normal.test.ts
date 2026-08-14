import { expect, test } from "vitest";
import { Parse } from "../../parse";
import { SourceRange } from "../../source-range";
import { Resolve } from "..";

test("前方参照があっても未定義警告にならない", () => {
  const { document } = Parse.parse(`data 注文 = 注文ID
data 注文ID = string`);

  expect(Resolve.resolve(document).diagnostics).toEqual([]);
});

test("コメント中の識別子は参照解決の対象外になる", () => {
  const { document } = Parse.parse("data 注文ID = string // 未定義型");

  expect(Resolve.resolve(document).diagnostics).toEqual([]);
  expect(Resolve.resolve(document).references).toEqual({
    注文ID: [SourceRange.onLine(1, 6, 10)],
  });
});

test("未定義の型参照は警告になる", () => {
  const { document } = Parse.parse("data 注文 = 未定義型");

  expect(Resolve.resolve(document).diagnostics).toEqual([
    {
      severity: "warning",
      message: "「未定義型」は未定義です",
      range: SourceRange.onLine(1, 11, 15),
    },
  ]);
});

test("同名の data 再宣言はエラーになる", () => {
  const { document } = Parse.parse(`data 注文ID = string
data 注文ID = int`);

  expect(Resolve.resolve(document).diagnostics).toEqual([
    {
      severity: "error",
      message: "「注文ID」は既に宣言されています",
      range: SourceRange.onLine(2, 6, 10),
    },
  ]);
});

test("data と workflow の同名はエラーになる", () => {
  const source = `data 注文を確定する = string
workflow 注文を確定する =
  input: string
  output: string`;
  const { document } = Parse.parse(source);

  expect(Resolve.resolve(document).diagnostics).toEqual([
    {
      severity: "error",
      message: "「注文を確定する」は既に宣言されています",
      range: SourceRange.onLine(2, 10, 17),
    },
  ]);
});

test("プリミティブ型への参照は未定義警告にならない", () => {
  const { document } = Parse.parse("data 名前 = string");

  expect(Resolve.resolve(document).diagnostics).toEqual([]);
});

test("定義表は data と workflow の名前を同一空間で保持する", () => {
  const source = `data 注文ID = string
workflow 注文を確定する =
  input: 注文ID
  output: string`;
  const { document } = Parse.parse(source);
  const result = Resolve.resolve(document);

  expect(result.diagnostics).toEqual([]);
  expect(result.definitions["注文ID"]?.kind).toBe("data");
  expect(result.definitions["注文を確定する"]?.kind).toBe("workflow");
});

test("参照表は宣言名と型参照の位置を出現順に集める", () => {
  const source = `data 注文 = 注文ID
data 注文ID = string`;
  const { document } = Parse.parse(source);

  expect(Resolve.resolve(document).references).toEqual({
    注文: [SourceRange.onLine(1, 6, 8)],
    注文ID: [
      SourceRange.onLine(1, 11, 15),
      SourceRange.onLine(2, 6, 10),
    ],
  });
});

test("後置修飾付きの未定義参照は型名だけの範囲を警告する", () => {
  const { document } = Parse.parse("data 明細 = 注文明細 list");

  expect(Resolve.resolve(document).diagnostics).toEqual([
    {
      severity: "warning",
      message: "「注文明細」は未定義です",
      range: SourceRange.onLine(1, 11, 15),
    },
  ]);
});

test("workflow の未定義参照も警告になる", () => {
  const source = `workflow 注文を確定する =
  input: 未検証の注文
  output: 注文確定イベント`;
  const { document } = Parse.parse(source);

  expect(Resolve.resolve(document).diagnostics).toEqual([
    {
      severity: "warning",
      message: "「未検証の注文」は未定義です",
      range: SourceRange.onLine(2, 10, 16),
    },
    {
      severity: "warning",
      message: "「注文確定イベント」は未定義です",
      range: SourceRange.onLine(3, 11, 19),
    },
  ]);
});
