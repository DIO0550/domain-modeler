import { expect, test } from "vitest";
import { Tokenizer } from "../../../tokenizer";
import { ChunkCursor } from "../../chunk-cursor";
import { DeclChunk } from "../../decl-chunk";
import { TypeTermParse } from "..";

test("予約語は型参照項として解析しない", () => {
  const tokens = Tokenizer.tokenize("OR");
  const chunk: DeclChunk = {
    kind: "data",
    tokens,
    range: DeclChunk.rangeOf(tokens),
  };

  expect(TypeTermParse.parse(ChunkCursor.create(tokens), chunk)).toMatchObject({
    ok: false,
    error: {
      message: "型参照の識別子またはプリミティブ型が必要です",
    },
  });
});
