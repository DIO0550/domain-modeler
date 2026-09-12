import { expect, test } from "vitest";
import {
  Constraint,
  DataDecl,
  NumberRange,
  PRIMITIVES,
  SourceRange,
  TYPE_MODIFIERS,
  TypeExpr,
  TypeTerm,
} from "@domain-modeler/model-core";
import { DataCardPreview, PreviewTypeRef } from "..";

const range = SourceRange.onLine(1, 1, 40);
const noUndefined = new Set<string>();

test("単一参照の data 宣言は ALIAS プレビューになる", () => {
  const term = TypeTerm.create({
    name: "string",
    isPrimitive: true,
    modifiers: [],
    range,
  });
  const preview = DataCardPreview.of(
    DataDecl.create({
      name: "注文ID",
      nameRange: range,
      typeExpr: TypeExpr.alias(term, range),
      range,
    }),
    noUndefined,
  );

  expect(preview).toEqual({
    kind: "ALIAS",
    name: "注文ID",
    term: { term, isUndefined: false },
  });
});

test("AND 連結の data 宣言は RECORD プレビューになる", () => {
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
      modifiers: [TYPE_MODIFIERS.list],
      range,
    }),
  ];
  const preview = DataCardPreview.of(
    DataDecl.create({
      name: "検証済みの注文",
      nameRange: range,
      typeExpr: TypeExpr.record(fields, range),
      range,
    }),
    noUndefined,
  );

  expect(preview).toEqual({
    kind: "RECORD",
    name: "検証済みの注文",
    fields: [
      { term: fields[0], isUndefined: false },
      { term: fields[1], isUndefined: false },
    ],
  });
});

test("OR 連結の data 宣言は CHOICE プレビューになる", () => {
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
  const preview = DataCardPreview.of(
    DataDecl.create({
      name: "注文",
      nameRange: range,
      typeExpr: TypeExpr.choice(cases, range),
      range,
    }),
    noUndefined,
  );

  expect(preview).toEqual({
    kind: "CHOICE",
    name: "注文",
    cases: [
      { term: cases[0], isUndefined: false },
      { term: cases[1], isUndefined: false },
    ],
  });
});

test("制約付き data 宣言は VALUE プレビューで int 1..100 になる", () => {
  const preview = DataCardPreview.of(
    DataDecl.create({
      name: "注文数量",
      nameRange: range,
      typeExpr: TypeExpr.value({
        primitive: PRIMITIVES.int,
        primitiveRange: range,
        constraint: Constraint.numeric(NumberRange.both(1, 100), range),
        range,
      }),
      range,
    }),
    noUndefined,
  );

  expect(preview).toEqual({
    kind: "VALUE",
    name: "注文数量",
    caption: "int 1..100",
  });
});

test("文字列長制約は VALUE プレビューで string 1..50 になる", () => {
  const preview = DataCardPreview.of(
    DataDecl.create({
      name: "顧客名",
      nameRange: range,
      typeExpr: TypeExpr.value({
        primitive: PRIMITIVES.string,
        primitiveRange: range,
        constraint: Constraint.length(NumberRange.both(1, 50), range),
        range,
      }),
      range,
    }),
    noUndefined,
  );

  expect(preview).toEqual({
    kind: "VALUE",
    name: "顧客名",
    caption: "string 1..50",
  });
});

test("下限のみの数値制約は VALUE プレビューで int 1.. になる", () => {
  const preview = DataCardPreview.of(
    DataDecl.create({
      name: "下限数量",
      nameRange: range,
      typeExpr: TypeExpr.value({
        primitive: PRIMITIVES.int,
        primitiveRange: range,
        constraint: Constraint.numeric(NumberRange.minOnly(1), range),
        range,
      }),
      range,
    }),
    noUndefined,
  );

  expect(preview).toEqual({
    kind: "VALUE",
    name: "下限数量",
    caption: "int 1..",
  });
});

test("上限のみの数値制約は VALUE プレビューで decimal ..100 になる", () => {
  const preview = DataCardPreview.of(
    DataDecl.create({
      name: "上限数量",
      nameRange: range,
      typeExpr: TypeExpr.value({
        primitive: PRIMITIVES.decimal,
        primitiveRange: range,
        constraint: Constraint.numeric(NumberRange.maxOnly(100), range),
        range,
      }),
      range,
    }),
    noUndefined,
  );

  expect(preview).toEqual({
    kind: "VALUE",
    name: "上限数量",
    caption: "decimal ..100",
  });
});

test("未定義の名前付き型参照は isUndefined になる", () => {
  const term = TypeTerm.create({
    name: "顧客情報",
    isPrimitive: false,
    modifiers: [],
    range,
  });

  expect(PreviewTypeRef.of(term, new Set(["顧客情報"]))).toEqual({
    term,
    isUndefined: true,
  });
});

test("定義済みの名前付き型参照は isUndefined にならない", () => {
  const term = TypeTerm.create({
    name: "注文ID",
    isPrimitive: false,
    modifiers: [],
    range,
  });

  expect(PreviewTypeRef.of(term, new Set(["顧客情報"]))).toEqual({
    term,
    isUndefined: false,
  });
});

test("プリミティブ型は未定義名に含まれていても isUndefined にならない", () => {
  const term = TypeTerm.create({
    name: "string",
    isPrimitive: true,
    modifiers: [TYPE_MODIFIERS.option],
    range,
  });

  expect(PreviewTypeRef.of(term, new Set(["string"]))).toEqual({
    term,
    isUndefined: false,
  });
});
