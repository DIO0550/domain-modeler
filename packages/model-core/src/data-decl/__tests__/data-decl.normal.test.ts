import { expect, test } from "vitest";
import { Constraint } from "../../constraint";
import { NumberRange } from "../../number-range";
import { PRIMITIVES } from "../../primitive";
import { SourceRange } from "../../source-range";
import { TypeExpr } from "../../type-expr";
import { TypeTerm } from "../../type-term";
import { DATA_CARD_KINDS, DataDecl } from "..";

test("alias 型式の data 宣言は ALIAS カードになる", () => {
  const typeExpr = TypeExpr.alias(
    TypeTerm.create({
      name: "string",
      isPrimitive: true,
      modifiers: [],
      range: SourceRange.onLine(1, 12, 18),
    }),
    SourceRange.onLine(1, 12, 18),
  );
  const decl = DataDecl.create({
    name: "注文ID",
    nameRange: SourceRange.onLine(1, 6, 11),
    typeExpr,
    range: SourceRange.onLine(1, 1, 18),
  });
  expect(decl.kind).toBe("data");
  expect(DataDecl.cardKind(decl)).toBe(DATA_CARD_KINDS.ALIAS);
});

test("record 型式の data 宣言は RECORD カードになる", () => {
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
  const decl = DataDecl.create({
    name: "注文",
    nameRange: SourceRange.onLine(1, 6, 8),
    typeExpr: TypeExpr.record(terms, SourceRange.onLine(2, 3, 11)),
    range: SourceRange.onLine(1, 1, 11),
  });
  expect(DataDecl.cardKind(decl)).toBe(DATA_CARD_KINDS.RECORD);
});

test("choice 型式の data 宣言は CHOICE カードになる", () => {
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
  const decl = DataDecl.create({
    name: "注文",
    nameRange: SourceRange.onLine(1, 6, 8),
    typeExpr: TypeExpr.choice(terms, SourceRange.onLine(1, 10, 27)),
    range: SourceRange.onLine(1, 1, 27),
  });
  expect(DataDecl.cardKind(decl)).toBe(DATA_CARD_KINDS.CHOICE);
});

test("value 型式の data 宣言は VALUE カードになる", () => {
  const decl = DataDecl.create({
    name: "注文数量",
    nameRange: SourceRange.onLine(1, 6, 10),
    typeExpr: TypeExpr.value({
      primitive: PRIMITIVES.int,
      primitiveRange: SourceRange.onLine(1, 14, 17),
      constraint: Constraint.numeric(
        NumberRange.both(1, 100),
        SourceRange.onLine(1, 20, 26),
      ),
      range: SourceRange.onLine(1, 14, 26),
    }),
    range: SourceRange.onLine(1, 1, 26),
  });
  expect(DataDecl.cardKind(decl)).toBe(DATA_CARD_KINDS.VALUE);
});

test("data 宣言の型式から型参照項を列挙する", () => {
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
  const decl = DataDecl.create({
    name: "注文",
    nameRange: SourceRange.onLine(1, 6, 8),
    typeExpr: TypeExpr.record(terms, SourceRange.onLine(2, 3, 11)),
    range: SourceRange.onLine(1, 1, 11),
  });

  expect(DataDecl.referencedTerms(decl)).toEqual(terms);
});
