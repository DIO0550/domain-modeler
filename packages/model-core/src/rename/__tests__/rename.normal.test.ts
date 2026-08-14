import { expect, test } from "vitest";
import { Parse } from "../../parse";
import { Resolve } from "../../resolve";
import { SourceRange } from "../../source-range";
import { Rename } from "..";

const rangesFromSource = (
  source: string,
  name: string,
): readonly SourceRange[] => {
  const { document } = Parse.parse(source);
  return Rename.collectRanges(Resolve.resolve(document).references, name);
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
