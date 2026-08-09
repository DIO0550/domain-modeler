import { expect, test } from "vitest";
import { Primitive } from "..";

test("Object.prototype のキーはプリミティブ型として扱わない", () => {
  expect(Primitive.is("toString")).toBe(false);
  expect(Primitive.is("hasOwnProperty")).toBe(false);
});
