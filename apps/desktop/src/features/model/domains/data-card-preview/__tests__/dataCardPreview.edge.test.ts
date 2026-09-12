import { expect, test } from "vitest";
import {
  DataDecl,
  SourceRange,
  TYPE_MODIFIERS,
  TypeExpr,
  TypeTerm,
} from "@domain-modeler/model-core";
import { DataCardPreview } from "..";

const range = SourceRange.onLine(2, 3, 20);

test("RECORD の一部フィールドだけ未定義になる", () => {
  const fields = [
    TypeTerm.create({
      name: "注文ID",
      isPrimitive: false,
      modifiers: [],
      range,
    }),
    TypeTerm.create({
      name: "顧客情報",
      isPrimitive: false,
      modifiers: [TYPE_MODIFIERS.option],
      range,
    }),
    TypeTerm.create({
      name: "string",
      isPrimitive: true,
      modifiers: [TYPE_MODIFIERS.list],
      range,
    }),
  ];
  const preview = DataCardPreview.create(
    DataDecl.create({
      name: "注文",
      nameRange: range,
      typeExpr: TypeExpr.record(fields, range),
      range,
    }),
    new Set(["顧客情報", "string"]),
  );

  expect(preview).toEqual({
    kind: "RECORD",
    name: "注文",
    fields: [
      { term: fields[0], isUndefined: false },
      { term: fields[1], isUndefined: true },
      { term: fields[2], isUndefined: false },
    ],
  });
});

test("CHOICE の全ケースが未定義でもプレビューを組み立てる", () => {
  const cases = [
    TypeTerm.create({
      name: "未検証の注文",
      isPrimitive: false,
      modifiers: [],
      range,
    }),
    TypeTerm.create({
      name: "検証済みの注文",
      isPrimitive: false,
      modifiers: [],
      range,
    }),
  ];
  const preview = DataCardPreview.create(
    DataDecl.create({
      name: "注文",
      nameRange: range,
      typeExpr: TypeExpr.choice(cases, range),
      range,
    }),
    new Set(["未検証の注文", "検証済みの注文"]),
  );

  expect(preview).toEqual({
    kind: "CHOICE",
    name: "注文",
    cases: [
      { term: cases[0], isUndefined: true },
      { term: cases[1], isUndefined: true },
    ],
  });
});

test("ALIAS の後置修飾付き未定義参照を保持する", () => {
  const term = TypeTerm.create({
    name: "注文明細",
    isPrimitive: false,
    modifiers: [TYPE_MODIFIERS.list, TYPE_MODIFIERS.option],
    range,
  });
  const preview = DataCardPreview.create(
    DataDecl.create({
      name: "明細一覧",
      nameRange: range,
      typeExpr: TypeExpr.alias(term, range),
      range,
    }),
    new Set(["注文明細"]),
  );

  expect(preview).toEqual({
    kind: "ALIAS",
    name: "明細一覧",
    term: { term, isUndefined: true },
  });
});
