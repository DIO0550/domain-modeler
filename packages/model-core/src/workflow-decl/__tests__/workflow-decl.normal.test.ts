import { expect, test } from "vitest";
import { SourceRange } from "../../source-range";
import { TypeTerm } from "../../type-term";
import {
  WorkflowDecl,
  WorkflowErrorClause,
  WorkflowSection,
} from "..";

test("error 節なしの workflow 宣言を生成する", () => {
  const input = WorkflowSection.create(
    [
      TypeTerm.create({
        name: "未検証の注文",
        isPrimitive: false,
        modifiers: [],
        range: SourceRange.onLine(2, 10, 16),
      }),
    ],
    SourceRange.onLine(2, 3, 16),
  );
  const output = WorkflowSection.create(
    [
      TypeTerm.create({
        name: "注文確定イベント",
        isPrimitive: false,
        modifiers: [],
        range: SourceRange.onLine(3, 11, 19),
      }),
    ],
    SourceRange.onLine(3, 3, 19),
  );
  const decl = WorkflowDecl.create({
    name: "注文を確定する",
    nameRange: SourceRange.onLine(1, 10, 17),
    input,
    output,
    error: WorkflowErrorClause.absent(),
    range: SourceRange.onLine(1, 1, 19),
  });
  expect(decl.kind).toBe("workflow");
  expect(WorkflowDecl.hasError(decl)).toBe(false);
  expect(decl.error).toEqual({ present: false });
});

test("error 節ありの workflow 宣言を生成する", () => {
  const errorTerms = [
    TypeTerm.create({
      name: "検証エラー",
      isPrimitive: false,
      modifiers: [],
      range: SourceRange.onLine(4, 10, 15),
    }),
  ];
  const decl = WorkflowDecl.create({
    name: "注文を確定する",
    nameRange: SourceRange.onLine(1, 10, 17),
    input: WorkflowSection.create([], SourceRange.onLine(2, 3, 10)),
    output: WorkflowSection.create([], SourceRange.onLine(3, 3, 11)),
    error: WorkflowErrorClause.present(
      errorTerms,
      SourceRange.onLine(4, 3, 15),
    ),
    range: SourceRange.onLine(1, 1, 15),
  });
  expect(WorkflowDecl.hasError(decl)).toBe(true);
  expect(decl.error).toEqual({
    present: true,
    terms: errorTerms,
    range: SourceRange.onLine(4, 3, 15),
  });
});
