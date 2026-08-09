import { expectTypeOf, test } from "vitest";
import type { NumberRange } from "..";

test("both は min と max を必須に持つ", () => {
  expectTypeOf<Extract<NumberRange, { bound: "both" }>>().toHaveProperty("min");
  expectTypeOf<Extract<NumberRange, { bound: "both" }>>().toHaveProperty("max");
});

test("minOnly は max を持たない", () => {
  expectTypeOf<Extract<NumberRange, { bound: "minOnly" }>>().not.toHaveProperty(
    "max",
  );
});

test("maxOnly は min を持たない", () => {
  expectTypeOf<Extract<NumberRange, { bound: "maxOnly" }>>().not.toHaveProperty(
    "min",
  );
});
