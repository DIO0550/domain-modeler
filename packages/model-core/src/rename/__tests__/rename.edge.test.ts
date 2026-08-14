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
