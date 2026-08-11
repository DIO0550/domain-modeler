import { expectTypeOf, test } from "vitest";
import type { Diagnostic } from "../../../diagnostic";
import type { Declaration } from "../../../document";
import type { MaterializedDecl } from "..";

test("MaterializedDecl は declaration と diagnostics を持つ", () => {
  expectTypeOf<MaterializedDecl>().toHaveProperty("declaration");
  expectTypeOf<MaterializedDecl>().toHaveProperty("diagnostics");
  expectTypeOf<MaterializedDecl["declaration"]>().toEqualTypeOf<Declaration>();
  expectTypeOf<MaterializedDecl["diagnostics"]>().toEqualTypeOf<
    readonly Diagnostic[]
  >();
});
