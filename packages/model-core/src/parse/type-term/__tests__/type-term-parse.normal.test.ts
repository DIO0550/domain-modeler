import { expect, test } from "vitest";
import { Tokenizer } from "../../../tokenizer";
import { ChunkCursor } from "../../chunk-cursor";
import { DeclChunk } from "../../decl-chunk";
import { TypeTermParse } from "..";

/**
 * ソース先頭の型参照項を解析する。
 * @param source 型参照項のソース。
 * @returns 型参照項と消費後カーソル、または診断。
 */
const parseTerm = (source: string) => {
  const tokens = Tokenizer.tokenize(source);
  const chunk: DeclChunk = {
    kind: "data",
    tokens,
    range: DeclChunk.rangeOf(tokens),
  };
  return TypeTermParse.parse(ChunkCursor.create(tokens), chunk);
};

test("型参照名と後置修飾を解析する", () => {
  expect(parseTerm("注文明細 list option")).toMatchObject({
    ok: true,
    value: {
      value: {
        name: "注文明細",
        isPrimitive: false,
        modifiers: ["list", "option"],
      },
    },
  });
});

test("プリミティブ型を型参照項として解析する", () => {
  expect(parseTerm("string")).toMatchObject({
    ok: true,
    value: { value: { name: "string", isPrimitive: true } },
  });
});
