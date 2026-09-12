import { expectTypeOf, test } from "vitest";
import type { PreviewTypeRef } from "..";

test("primitive 解決は undefined 解決と両立しない", () => {
  expectTypeOf<
    Extract<PreviewTypeRef, { resolution: "primitive" }>["resolution"]
  >().toEqualTypeOf<"primitive">();
  expectTypeOf<
    Extract<PreviewTypeRef, { resolution: "undefined" }>["resolution"]
  >().toEqualTypeOf<"undefined">();
});

test("PreviewTypeRef は isUndefined フラグを持たない", () => {
  expectTypeOf<PreviewTypeRef>().not.toHaveProperty("isUndefined");
});
