import { expect, test } from "vitest";
import { TYPE_MODIFIERS, TypeModifier } from "..";

test.each(Object.values(TYPE_MODIFIERS))(
  "TYPE_MODIFIERS の %s を TypeModifier.is が受け入れる",
  (value) => {
    expect(TypeModifier.is(value)).toBe(true);
  },
);

test("未知の文字列は後置修飾ではない", () => {
  expect(TypeModifier.is("constrained")).toBe(false);
});
