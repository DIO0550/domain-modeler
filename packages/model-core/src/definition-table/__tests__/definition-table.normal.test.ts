import { expect, test } from "vitest";
import { DataDecl } from "../../data-decl";
import { SourceRange } from "../../source-range";
import { TypeExpr } from "../../type-expr";
import { TypeTerm } from "../../type-term";
import {
  WorkflowDecl,
  WorkflowErrorClause,
  WorkflowSection,
} from "../../workflow-decl";
import { DefinitionTable } from "..";

const aliasDecl = (name: string, line: number): DataDecl =>
  DataDecl.create({
    name,
    nameRange: SourceRange.onLine(line, 6, 6 + name.length),
    typeExpr: TypeExpr.alias(
      TypeTerm.create({
        name: "string",
        isPrimitive: true,
        modifiers: [],
        range: SourceRange.onLine(line, 9 + name.length, 15 + name.length),
      }),
      SourceRange.onLine(line, 9 + name.length, 15 + name.length),
    ),
    range: SourceRange.onLine(line, 1, 15 + name.length),
  });

test("先頭の同名宣言を定義として残す", () => {
  const first = aliasDecl("注文ID", 1);
  const second = aliasDecl("注文ID", 2);

  expect(DefinitionTable.create([first, second])["注文ID"]).toBe(first);
});

test("定義表に載っている名前は has が真になる", () => {
  const decl = aliasDecl("注文ID", 1);

  expect(DefinitionTable.has(DefinitionTable.create([decl]), "注文ID")).toBe(
    true,
  );
});

test("定義表に無い名前は has が偽になる", () => {
  const decl = aliasDecl("注文ID", 1);

  expect(DefinitionTable.has(DefinitionTable.create([decl]), "未定義")).toBe(
    false,
  );
});

test("同名の再宣言をエラー診断として集める", () => {
  const first = aliasDecl("注文ID", 1);
  const second = aliasDecl("注文ID", 2);

  expect(DefinitionTable.collectRedeclarationErrors([first, second])).toEqual([
    {
      severity: "error",
      message: "「注文ID」は既に宣言されています",
      range: second.nameRange,
    },
  ]);
});

test("data と workflow の同名も再宣言エラーになる", () => {
  const data = aliasDecl("注文を確定する", 1);
  const workflow = WorkflowDecl.create({
    name: "注文を確定する",
    nameRange: SourceRange.onLine(2, 10, 17),
    input: WorkflowSection.create([], SourceRange.onLine(3, 3, 10)),
    output: WorkflowSection.create([], SourceRange.onLine(4, 3, 11)),
    error: WorkflowErrorClause.absent(),
    range: SourceRange.onLine(2, 1, 11),
  });

  expect(
    DefinitionTable.collectRedeclarationErrors([data, workflow]),
  ).toEqual([
    {
      severity: "error",
      message: "「注文を確定する」は既に宣言されています",
      range: workflow.nameRange,
    },
  ]);
});
