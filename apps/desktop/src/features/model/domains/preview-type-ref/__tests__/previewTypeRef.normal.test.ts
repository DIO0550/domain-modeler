import { expect, test } from "vitest";
import { SourceRange, TYPE_MODIFIERS, TypeTerm } from "@domain-modeler/model-core";
import { PreviewTypeRef } from "..";

const range = SourceRange.onLine(1, 1, 40);

test("未定義の名前付き型参照は undefined 解決になる", () => {
  const term = TypeTerm.create({
    name: "顧客情報",
    isPrimitive: false,
    modifiers: [],
    range,
  });

  expect(PreviewTypeRef.create(term, new Set(["顧客情報"]))).toEqual({
    term,
    resolution: "undefined",
  });
});

test("定義済みの名前付き型参照は defined 解決になる", () => {
  const term = TypeTerm.create({
    name: "注文ID",
    isPrimitive: false,
    modifiers: [],
    range,
  });

  expect(PreviewTypeRef.create(term, new Set(["顧客情報"]))).toEqual({
    term,
    resolution: "defined",
  });
});

test("プリミティブ型は未定義名に含まれていても primitive 解決になる", () => {
  const term = TypeTerm.create({
    name: "string",
    isPrimitive: true,
    modifiers: [TYPE_MODIFIERS.option],
    range,
  });

  expect(PreviewTypeRef.create(term, new Set(["string"]))).toEqual({
    term,
    resolution: "primitive",
  });
});

test("型参照項の列を出現順のプレビュー参照にする", () => {
  const defined = TypeTerm.create({
    name: "注文ID",
    isPrimitive: false,
    modifiers: [],
    range,
  });
  const missing = TypeTerm.create({
    name: "顧客情報",
    isPrimitive: false,
    modifiers: [],
    range,
  });
  const primitive = TypeTerm.create({
    name: "string",
    isPrimitive: true,
    modifiers: [],
    range,
  });

  expect(
    PreviewTypeRef.createMany(
      [defined, missing, primitive],
      new Set(["顧客情報"]),
    ),
  ).toEqual([
    { term: defined, resolution: "defined" },
    { term: missing, resolution: "undefined" },
    { term: primitive, resolution: "primitive" },
  ]);
});

test("定義済み参照だけ isDefined が真になる", () => {
  const defined = PreviewTypeRef.create(
    TypeTerm.create({
      name: "注文ID",
      isPrimitive: false,
      modifiers: [],
      range,
    }),
    new Set(["顧客情報"]),
  );
  const missing = PreviewTypeRef.create(
    TypeTerm.create({
      name: "顧客情報",
      isPrimitive: false,
      modifiers: [],
      range,
    }),
    new Set(["顧客情報"]),
  );

  expect(PreviewTypeRef.isDefined(defined)).toBe(true);
  expect(PreviewTypeRef.isDefined(missing)).toBe(false);
  expect(PreviewTypeRef.isUndefined(defined)).toBe(false);
});
