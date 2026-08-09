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
