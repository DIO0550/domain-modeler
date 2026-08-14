import { expect, test } from "vitest";
import { DataDecl } from "../../data-decl";
import { SourceRange } from "../../source-range";
import { TypeExpr } from "../../type-expr";
import { TypeTerm } from "../../type-term";
import { ReferenceTable } from "..";

test("宣言名と名前付き型参照の出現位置を出現順に集める", () => {
  const orderIdTerm = TypeTerm.create({
    name: "注文ID",
    isPrimitive: false,
    modifiers: [],
    range: SourceRange.onLine(1, 11, 15),
  });
  const order = DataDecl.create({
    name: "注文",
    nameRange: SourceRange.onLine(1, 6, 8),
    typeExpr: TypeExpr.alias(orderIdTerm, orderIdTerm.range),
    range: SourceRange.onLine(1, 1, 15),
  });
  const orderId = DataDecl.create({
    name: "注文ID",
    nameRange: SourceRange.onLine(2, 6, 10),
    typeExpr: TypeExpr.alias(
      TypeTerm.create({
        name: "string",
        isPrimitive: true,
        modifiers: [],
        range: SourceRange.onLine(2, 13, 19),
      }),
      SourceRange.onLine(2, 13, 19),
    ),
    range: SourceRange.onLine(2, 1, 19),
  });

  expect(ReferenceTable.create([order, orderId])).toEqual({
    注文: [SourceRange.onLine(1, 6, 8)],
    注文ID: [
      TypeTerm.nameRange(orderIdTerm),
      SourceRange.onLine(2, 6, 10),
    ],
  });
});

test("プリミティブ型への参照は参照表に載せない", () => {
  const decl = DataDecl.create({
    name: "名前",
    nameRange: SourceRange.onLine(1, 6, 8),
    typeExpr: TypeExpr.alias(
      TypeTerm.create({
        name: "string",
        isPrimitive: true,
        modifiers: [],
        range: SourceRange.onLine(1, 11, 17),
      }),
      SourceRange.onLine(1, 11, 17),
    ),
    range: SourceRange.onLine(1, 1, 17),
  });

  expect(ReferenceTable.create([decl])).toEqual({
    名前: [SourceRange.onLine(1, 6, 8)],
  });
});
