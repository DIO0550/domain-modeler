import { expect, test } from "vitest";
import { TYPE_MODIFIERS } from "../../type-modifier";
import { SourceRange } from "../../source-range";
import { TypeTerm } from "..";

test("修飾なしの識別子項を生成する", () => {
  const range = SourceRange.onLine(1, 10, 15);
  expect(
    TypeTerm.create({
      name: "注文ID",
      isPrimitive: false,
      modifiers: [],
      range,
    }),
  ).toEqual({
    name: "注文ID",
    isPrimitive: false,
    modifiers: [],
    range,
  });
});

test("プリミティブに list と option を重ねた項を生成する", () => {
  const range = SourceRange.onLine(3, 5, 24);
  expect(
    TypeTerm.create({
      name: "string",
      isPrimitive: true,
      modifiers: [TYPE_MODIFIERS.list, TYPE_MODIFIERS.option],
      range,
    }),
  ).toEqual({
    name: "string",
    isPrimitive: true,
    modifiers: ["list", "option"],
    range,
  });
});

test("後置修飾を除いた型名だけのソース範囲を返す", () => {
  const term = TypeTerm.create({
    name: "注文明細",
    isPrimitive: false,
    modifiers: [TYPE_MODIFIERS.list],
    range: SourceRange.onLine(1, 11, 20),
  });

  expect(TypeTerm.nameRange(term)).toEqual(SourceRange.onLine(1, 11, 15));
});

test("プリミティブ型は参照解決の対象外である", () => {
  const term = TypeTerm.create({
    name: "string",
    isPrimitive: true,
    modifiers: [],
    range: SourceRange.onLine(1, 13, 19),
  });

  expect(TypeTerm.isResolvable(term)).toBe(false);
});

test("名前付き型参照は参照解決の対象である", () => {
  const term = TypeTerm.create({
    name: "注文ID",
    isPrimitive: false,
    modifiers: [],
    range: SourceRange.onLine(1, 11, 15),
  });

  expect(TypeTerm.isResolvable(term)).toBe(true);
});
