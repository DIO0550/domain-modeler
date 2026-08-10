import { expect, test } from "vitest";
import { SourceRange } from "../../../source-range";
import { TOKEN_KINDS, Token } from "../../../token";
import { ChunkCursor } from "../../chunk-cursor";
import type { DeclChunk } from "../../decl-chunk";
import { ExpectToken } from "..";

const chunkOf = (tokens: readonly Token[]): DeclChunk => ({
  kind: "data",
  tokens,
  range: SourceRange.onLine(1, 1, 10),
});

test("errorAt は error 深刻度の診断を生成する", () => {
  expect(
    ExpectToken.errorAt("範囲の下限が上限を超えています", SourceRange.onLine(1, 2, 5)),
  ).toEqual({
    severity: "error",
    message: "範囲の下限が上限を超えています",
    range: SourceRange.onLine(1, 2, 5),
  });
});

test("fallbackRange はカーソル位置のトークン範囲を返す", () => {
  const token = Token.create(TOKEN_KINDS.identifier, "注文", 1, 3);
  const cursor = new ChunkCursor([token]);
  expect(ExpectToken.fallbackRange(cursor, chunkOf([token]))).toEqual(
    token.range,
  );
});

test("fallbackRange は意味トークンが無いときチャンク範囲を返す", () => {
  const chunk = chunkOf([]);
  const cursor = new ChunkCursor([]);
  expect(ExpectToken.fallbackRange(cursor, chunk)).toEqual(chunk.range);
});

test("reserved は一致する予約語を消費して成功を返す", () => {
  const token = Token.create(TOKEN_KINDS.reserved, "data", 1, 1);
  const cursor = new ChunkCursor([token]);
  expect(ExpectToken.reserved(cursor, "data", chunkOf([token]), "data が必要です")).toEqual({
    ok: true,
    value: token,
  });
  expect(cursor.atEnd).toBe(true);
});

test("reserved は不一致のとき診断を返す", () => {
  const token = Token.create(TOKEN_KINDS.identifier, "注文", 1, 1);
  const cursor = new ChunkCursor([token]);
  expect(
    ExpectToken.reserved(cursor, "data", chunkOf([token]), "data が必要です"),
  ).toEqual({
    ok: false,
    error: {
      severity: "error",
      message: "data が必要です",
      range: token.range,
    },
  });
});

test("equals は = トークンを消費して成功を返す", () => {
  const token = Token.create(TOKEN_KINDS.equals, "=", 1, 5);
  const cursor = new ChunkCursor([token]);
  expect(ExpectToken.equals(cursor, chunkOf([token]))).toEqual({
    ok: true,
    value: token,
  });
});

test("equals は = 以外のとき診断を返す", () => {
  const token = Token.create(TOKEN_KINDS.identifier, "string", 1, 5);
  const cursor = new ChunkCursor([token]);
  expect(ExpectToken.equals(cursor, chunkOf([token]))).toEqual({
    ok: false,
    error: expect.objectContaining({ message: "= が必要です" }),
  });
});

test("identifierName は識別子を消費して成功を返す", () => {
  const token = Token.create(TOKEN_KINDS.identifier, "注文ID", 1, 6);
  const cursor = new ChunkCursor([token]);
  expect(ExpectToken.identifierName(cursor, chunkOf([token]))).toEqual({
    ok: true,
    value: token,
  });
});

test("identifierName は予約語のとき診断を返す", () => {
  const token = Token.create(TOKEN_KINDS.reserved, "AND", 1, 6);
  const cursor = new ChunkCursor([token]);
  expect(ExpectToken.identifierName(cursor, chunkOf([token]))).toEqual({
    ok: false,
    error: expect.objectContaining({
      message: "データ名の識別子が必要です",
    }),
  });
});
