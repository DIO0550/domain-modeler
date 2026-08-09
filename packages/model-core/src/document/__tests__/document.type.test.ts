import { expectTypeOf, test } from "vitest";
import type { Declaration } from "..";

test("Declaration は data / workflow / error の 3 kind のみ", () => {
  expectTypeOf<Declaration["kind"]>().toEqualTypeOf<
    "data" | "workflow" | "error"
  >();
});
