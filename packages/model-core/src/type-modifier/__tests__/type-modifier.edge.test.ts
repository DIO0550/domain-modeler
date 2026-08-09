import { expect, test } from "vitest";
import { TypeModifier } from "..";

test("Object.prototype のキーは後置修飾として扱わない", () => {
  expect(TypeModifier.is("toString")).toBe(false);
  expect(TypeModifier.is("hasOwnProperty")).toBe(false);
});
