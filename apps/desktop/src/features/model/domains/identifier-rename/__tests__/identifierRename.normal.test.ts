import { expect, test } from "vitest";
import { SourceRange } from "@domain-modeler/model-core";
import { IdentifierRename } from "..";

test("複数の出現を1回の編集で新しい名前へ置き換える", () => {
  const source = "data 注文ID = string\ndata 注文 = 注文ID";
  const start = source.indexOf("注文ID");
  const end = source.lastIndexOf("注文ID") + "注文ID".length;

  expect(
    IdentifierRename.create({
      source,
      ranges: [SourceRange.onLine(1, 6, 10), SourceRange.onLine(2, 11, 15)],
      nextName: "商品ID",
    }),
  ).toEqual({
    ok: true,
    value: {
      edit: {
        start,
        end,
        replacement: "商品ID = string\ndata 注文 = 商品ID",
      },
      caret: { offset: start, line: 1 },
    },
  });
});

test("1箇所だけの出現も新しい名前へ置き換える", () => {
  const source = "data 注文ID = string";
  const start = source.indexOf("注文ID");
  const end = start + "注文ID".length;

  expect(
    IdentifierRename.create({
      source,
      ranges: [SourceRange.onLine(1, 6, 10)],
      nextName: "商品ID",
    }),
  ).toEqual({
    ok: true,
    value: {
      edit: { start, end, replacement: "商品ID" },
      caret: { offset: start, line: 1 },
    },
  });
});

test("新しい名前の長さが違っても全出現を置き換える", () => {
  const source = "data 注文ID = string\ndata 注文 = 注文ID";
  const start = source.indexOf("注文ID");
  const end = source.lastIndexOf("注文ID") + "注文ID".length;

  expect(
    IdentifierRename.create({
      source,
      ranges: [SourceRange.onLine(1, 6, 10), SourceRange.onLine(2, 11, 15)],
      nextName: "ID",
    }),
  ).toEqual({
    ok: true,
    value: {
      edit: {
        start,
        end,
        replacement: "ID = string\ndata 注文 = ID",
      },
      caret: { offset: start, line: 1 },
    },
  });
});
