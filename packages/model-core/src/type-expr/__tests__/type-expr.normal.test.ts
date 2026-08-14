import { expect, test } from "vitest";
import { Constraint } from "../../constraint";
import { NumberRange } from "../../number-range";
import { PRIMITIVES } from "../../primitive";
import { SourceRange } from "../../source-range";
import { TypeTerm } from "../../type-term";
import { TypeExpr } from "..";

test("単一参照の alias 型式を生成する", () => {
  const term = TypeTerm.create({
    name: "string",
    isPrimitive: true,
    modifiers: [],
    range: SourceRange.onLine(1, 12, 18),
  });
  const range = SourceRange.onLine(1, 12, 18);
  const expr = TypeExpr.alias(term, range);
  expect(expr).toEqual({ form: "alias", term, range });
  expect(TypeExpr.isAlias(expr)).toBe(true);
});

test("AND 連結の record 型式を生成する", () => {
  const terms = [
    TypeTerm.create({
      name: "注文ID",
      isPrimitive: false,
      modifiers: [],
      range: SourceRange.onLine(2, 3, 8),
    }),
    TypeTerm.create({
      name: "顧客情報",
      isPrimitive: false,
      modifiers: [],
      range: SourceRange.onLine(3, 7, 11),
    }),
  ];
  const range = SourceRange.onLine(2, 3, 11);
  const expr = TypeExpr.record(terms, range);
  expect(expr).toEqual({ form: "record", terms, range });
  expect(TypeExpr.isRecord(expr)).toBe(true);
});

test("OR 連結の choice 型式を生成する", () => {
  const terms = [
    TypeTerm.create({
      name: "未検証の注文",
      isPrimitive: false,
      modifiers: [],
      range: SourceRange.onLine(1, 10, 16),
    }),
    TypeTerm.create({
      name: "検証済みの注文",
      isPrimitive: false,
      modifiers: [],
      range: SourceRange.onLine(1, 20, 27),
    }),
  ];
  const range = SourceRange.onLine(1, 10, 27);
  const expr = TypeExpr.choice(terms, range);
  expect(expr).toEqual({ form: "choice", terms, range });
  expect(TypeExpr.isChoice(expr)).toBe(true);
});

test("制約付きの value 型式を生成する", () => {
  const constraint = Constraint.numeric(
    NumberRange.both(1, 100),
    SourceRange.onLine(1, 20, 26),
  );
  const expr = TypeExpr.value({
    primitive: PRIMITIVES.int,
    primitiveRange: SourceRange.onLine(1, 14, 17),
    constraint,
    range: SourceRange.onLine(1, 14, 26),
  });
  expect(expr).toEqual({
    form: "value",
    primitive: "int",
    primitiveRange: SourceRange.onLine(1, 14, 17),
    constraint,
    range: SourceRange.onLine(1, 14, 26),
  });
  expect(TypeExpr.isValue(expr)).toBe(true);
});

test("alias / record / choice の型参照項を列挙し value は空にする", () => {
  const aliasTerm = TypeTerm.create({
    name: "注文ID",
    isPrimitive: false,
    modifiers: [],
    range: SourceRange.onLine(1, 12, 17),
  });
  const recordTerms = [
    TypeTerm.create({
      name: "注文ID",
      isPrimitive: false,
      modifiers: [],
      range: SourceRange.onLine(2, 3, 8),
    }),
    TypeTerm.create({
      name: "顧客情報",
      isPrimitive: false,
      modifiers: [],
      range: SourceRange.onLine(3, 7, 11),
    }),
  ];

  expect(
    TypeExpr.referencedTerms(
      TypeExpr.alias(aliasTerm, SourceRange.onLine(1, 12, 17)),
    ),
  ).toEqual([aliasTerm]);
  expect(
    TypeExpr.referencedTerms(
      TypeExpr.record(recordTerms, SourceRange.onLine(2, 3, 11)),
    ),
  ).toEqual(recordTerms);
  expect(
    TypeExpr.referencedTerms(
      TypeExpr.value({
        primitive: PRIMITIVES.int,
        primitiveRange: SourceRange.onLine(1, 14, 17),
        constraint: Constraint.numeric(
          NumberRange.both(1, 100),
          SourceRange.onLine(1, 20, 26),
        ),
        range: SourceRange.onLine(1, 14, 26),
      }),
    ),
  ).toEqual([]);
});
