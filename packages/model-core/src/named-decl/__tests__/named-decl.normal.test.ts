import { expect, test } from "vitest";
import { DataDecl } from "../../data-decl";
import { ErrorDecl } from "../../error-decl";
import { SourceRange } from "../../source-range";
import { TypeExpr } from "../../type-expr";
import { TypeTerm } from "../../type-term";
import {
  WorkflowDecl,
  WorkflowErrorClause,
  WorkflowSection,
} from "../../workflow-decl";
import { NamedDecl } from "..";

test("data 宣言は名前付き宣言である", () => {
  const decl = DataDecl.create({
    name: "注文ID",
    nameRange: SourceRange.onLine(1, 6, 10),
    typeExpr: TypeExpr.alias(
      TypeTerm.create({
        name: "string",
        isPrimitive: true,
        modifiers: [],
        range: SourceRange.onLine(1, 13, 19),
      }),
      SourceRange.onLine(1, 13, 19),
    ),
    range: SourceRange.onLine(1, 1, 19),
  });

  expect(NamedDecl.is(decl)).toBe(true);
});

test("workflow 宣言は名前付き宣言である", () => {
  const decl = WorkflowDecl.create({
    name: "注文を確定する",
    nameRange: SourceRange.onLine(1, 10, 17),
    input: WorkflowSection.create([], SourceRange.onLine(2, 3, 10)),
    output: WorkflowSection.create([], SourceRange.onLine(3, 3, 11)),
    error: WorkflowErrorClause.absent(),
    range: SourceRange.onLine(1, 1, 11),
  });

  expect(NamedDecl.is(decl)).toBe(true);
});

test("エラー宣言は名前付き宣言ではない", () => {
  expect(NamedDecl.is(ErrorDecl.create(SourceRange.onLine(1, 1, 8)))).toBe(
    false,
  );
});

test("data 宣言の型参照項を列挙する", () => {
  const term = TypeTerm.create({
    name: "注文ID",
    isPrimitive: false,
    modifiers: [],
    range: SourceRange.onLine(1, 11, 15),
  });
  const decl = DataDecl.create({
    name: "注文",
    nameRange: SourceRange.onLine(1, 6, 8),
    typeExpr: TypeExpr.alias(term, SourceRange.onLine(1, 11, 15)),
    range: SourceRange.onLine(1, 1, 15),
  });

  expect(NamedDecl.referencedTerms(decl)).toEqual([term]);
});
