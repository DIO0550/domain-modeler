import { expectTypeOf, test } from "vitest";
import type { WorkflowCardPreview, WorkflowCardSection } from "..";

test("3要素目は ERR 節か存在しないかのどちらかである", () => {
  expectTypeOf<WorkflowCardPreview["sections"][2]>().toEqualTypeOf<
    Extract<WorkflowCardSection, { kind: "error" }> | undefined
  >();
});

test("input 節の区切りは + で output 節の区切りは or である", () => {
  expectTypeOf<
    Extract<WorkflowCardSection, { kind: "input" }>["separator"]
  >().toEqualTypeOf<"+">();
  expectTypeOf<
    Extract<WorkflowCardSection, { kind: "output" }>["separator"]
  >().toEqualTypeOf<"or">();
});
