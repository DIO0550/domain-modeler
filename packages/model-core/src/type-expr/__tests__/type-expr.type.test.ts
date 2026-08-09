import { expectTypeOf, test } from "vitest";
import type { TypeExpr } from "..";

test("alias は term を持ち terms を持たない", () => {
  type Alias = Extract<TypeExpr, { form: "alias" }>;
  expectTypeOf<Alias>().toHaveProperty("term");
  expectTypeOf<Alias>().not.toHaveProperty("terms");
});

test("record は terms を持ち term を持たない", () => {
  type Record = Extract<TypeExpr, { form: "record" }>;
  expectTypeOf<Record>().toHaveProperty("terms");
  expectTypeOf<Record>().not.toHaveProperty("term");
});

test("choice は terms を持ち term を持たない", () => {
  type Choice = Extract<TypeExpr, { form: "choice" }>;
  expectTypeOf<Choice>().toHaveProperty("terms");
  expectTypeOf<Choice>().not.toHaveProperty("term");
});

test("value は primitive と constraint を持つ", () => {
  type Value = Extract<TypeExpr, { form: "value" }>;
  expectTypeOf<Value>().toHaveProperty("primitive");
  expectTypeOf<Value>().toHaveProperty("constraint");
  expectTypeOf<Value>().not.toHaveProperty("terms");
});
