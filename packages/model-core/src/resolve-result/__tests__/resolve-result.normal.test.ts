import { expect, test } from "vitest";
import { DataDecl } from "../../data-decl";
import { DefinitionTable } from "../../definition-table";
import { DIAGNOSTIC_SEVERITIES, Diagnostic } from "../../diagnostic";
import { SourceRange } from "../../source-range";
import { TypeExpr } from "../../type-expr";
import { TypeTerm } from "../../type-term";
import { ResolveResult } from "..";

test("定義表・参照表・診断から参照解決結果を生成する", () => {
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
  const definitions = DefinitionTable.create([decl]);
  const references = { 注文ID: [decl.nameRange] };
  const diagnostics = [
    Diagnostic.create(
      DIAGNOSTIC_SEVERITIES.warning,
      "「未定義型」は未定義です",
      SourceRange.onLine(1, 11, 15),
    ),
  ];

  expect(
    ResolveResult.create({ definitions, references, diagnostics }),
  ).toEqual({ definitions, references, diagnostics });
});
