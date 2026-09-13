import { expect, test } from "vitest";
import { SourceRange } from "@domain-modeler/model-core";
import { IdentifierRename } from "..";

test("予約語へのリネームは失敗する", () => {
  expect(
    IdentifierRename.create({
      source: "data 注文ID = string",
      ranges: [SourceRange.onLine(1, 6, 10)],
      nextName: "data",
    }),
  ).toEqual({
    ok: false,
    error: "invalid_identifier",
  });
});

test("空の名前へのリネームは失敗する", () => {
  expect(
    IdentifierRename.create({
      source: "data 注文ID = string",
      ranges: [SourceRange.onLine(1, 6, 10)],
      nextName: "",
    }),
  ).toEqual({
    ok: false,
    error: "invalid_identifier",
  });
});

test.each(["123", "A=B", ".", "/"])(
  "識別子1トークンにならない %s へのリネームは失敗する",
  (nextName: string) => {
    expect(
      IdentifierRename.create({
        source: "data 注文ID = string",
        ranges: [SourceRange.onLine(1, 6, 10)],
        nextName,
      }),
    ).toEqual({
      ok: false,
      error: "invalid_identifier",
    });
  },
);

test("出現位置が無い名前は失敗する", () => {
  expect(
    IdentifierRename.create({
      source: "data 注文ID = string",
      ranges: [],
      nextName: "商品ID",
    }),
  ).toEqual({
    ok: false,
    error: "name_not_found",
  });
});

test("文書に無い行の範囲だけなら失敗する", () => {
  expect(
    IdentifierRename.create({
      source: "data 注文ID = string",
      ranges: [SourceRange.onLine(3, 1, 5)],
      nextName: "商品ID",
    }),
  ).toEqual({
    ok: false,
    error: "name_not_found",
  });
});
