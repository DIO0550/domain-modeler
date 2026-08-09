import { expectTypeOf, test } from "vitest";
import type { WorkflowErrorClause } from "..";

test("present: true の error 節は terms と range を持つ", () => {
  type Present = Extract<WorkflowErrorClause, { present: true }>;
  expectTypeOf<Present>().toHaveProperty("terms");
  expectTypeOf<Present>().toHaveProperty("range");
});

test("present: false の error 節は terms を持たない", () => {
  type Absent = Extract<WorkflowErrorClause, { present: false }>;
  expectTypeOf<Absent>().not.toHaveProperty("terms");
  expectTypeOf<Absent>().not.toHaveProperty("range");
});
