import { expectTypeOf, test } from "vitest";
import type { Declaration } from "..";

test("Declaration は data / workflow / state-machine / error の kind を持つ", () => {
  expectTypeOf<Declaration["kind"]>().toEqualTypeOf<
    "data" | "workflow" | "state-machine" | "error"
  >();
});
