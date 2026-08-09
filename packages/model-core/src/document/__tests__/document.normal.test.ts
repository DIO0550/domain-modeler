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
import { Declaration, Document } from "..";

test("data・workflow・エラー宣言を出現順に保持する", () => {
  const data = DataDecl.create({
    name: "注文ID",
    nameRange: SourceRange.onLine(1, 6, 11),
    typeExpr: TypeExpr.alias(
      TypeTerm.create({
        name: "string",
        isPrimitive: true,
        modifiers: [],
        range: SourceRange.onLine(1, 14, 20),
      }),
      SourceRange.onLine(1, 14, 20),
    ),
    range: SourceRange.onLine(1, 1, 20),
  });
  const workflow = WorkflowDecl.create({
    name: "注文を確定する",
    nameRange: SourceRange.onLine(3, 10, 17),
    input: WorkflowSection.create([], SourceRange.onLine(4, 3, 10)),
    output: WorkflowSection.create([], SourceRange.onLine(5, 3, 11)),
    error: WorkflowErrorClause.absent(),
    range: SourceRange.onLine(3, 1, 11),
  });
  const broken = ErrorDecl.create(SourceRange.onLine(7, 1, 8));
  const document = Document.create(
    [data, broken, workflow],
    SourceRange.onLine(1, 1, 8),
  );
  expect(document.declarations).toEqual([data, broken, workflow]);
  expect(Declaration.isData(data)).toBe(true);
  expect(Declaration.isError(broken)).toBe(true);
  expect(Declaration.isWorkflow(workflow)).toBe(true);
});

test("空の宣言列でも Document を生成できる", () => {
  const range = SourceRange.onLine(1, 1, 1);
  expect(Document.create([], range)).toEqual({
    declarations: [],
    range,
  });
});
