import { expect, test } from "vitest";
import { Parse } from "../../parse";
import { Resolve } from "../../resolve";
import { SourceRange } from "../../source-range";
import { ReferenceTable } from "..";

const rangesFromSource = (
  source: string,
  name: string,
): readonly SourceRange[] => {
  const { document } = Parse.parse(source);
  return ReferenceTable.rangesOf(
    Resolve.resolve(document).references,
    name,
  );
};

test("宣言名と型参照の出現位置を出現順に返す", () => {
  const source = `data 注文 = 注文ID
data 注文ID = string`;

  expect(rangesFromSource(source, "注文ID")).toEqual([
    SourceRange.onLine(1, 11, 15),
    SourceRange.onLine(2, 6, 10),
  ]);
});

test("workflow 宣言名と節内の型参照も含める", () => {
  const source = `data 注文ID = string
workflow 注文を確定する =
  input: 注文ID
  output: string`;

  expect(rangesFromSource(source, "注文ID")).toEqual([
    SourceRange.onLine(1, 6, 10),
    SourceRange.onLine(3, 10, 14),
  ]);
  expect(rangesFromSource(source, "注文を確定する")).toEqual([
    SourceRange.onLine(2, 10, 17),
  ]);
});

test("未定義の型参照の出現位置も置換範囲に含める", () => {
  const source = `data 注文 = 未定義型
data 別 = 未定義型`;

  expect(rangesFromSource(source, "未定義型")).toEqual([
    SourceRange.onLine(1, 11, 15),
    SourceRange.onLine(2, 10, 14),
  ]);
});

test("後置修飾付きの型参照は型名だけの範囲を返す", () => {
  const source = `data 明細 = 注文明細 list
data 注文明細 = string`;

  expect(rangesFromSource(source, "注文明細")).toEqual([
    SourceRange.onLine(1, 11, 15),
    SourceRange.onLine(2, 6, 10),
  ]);
});

test("コメント内の同名文字列は置換範囲に含めない", () => {
  expect(rangesFromSource("data 注文ID = string // 注文ID", "注文ID")).toEqual(
    [SourceRange.onLine(1, 6, 10)],
  );
});

test("部分一致する別識別子は置換範囲に含めない", () => {
  const source = `data 注文 = 注文ID
data 注文明細 = 注文
data 注文ID = string`;

  expect(rangesFromSource(source, "注文")).toEqual([
    SourceRange.onLine(1, 6, 8),
    SourceRange.onLine(2, 13, 15),
  ]);
});

test("参照表に無い名前は空の範囲を返す", () => {
  expect(rangesFromSource("data 注文ID = string", "未出現")).toEqual([]);
});

test("プリミティブ型名は置換範囲に含めない", () => {
  expect(rangesFromSource("data 名前 = string", "string")).toEqual([]);
});
