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
    ExpectToken.errorAt(
      "範囲の下限が上限を超えています",
      SourceRange.onLine(1, 2, 5),
    ),
  ).toEqual({
    severity: "error",
    message: "範囲の下限が上限を超えています",
    range: SourceRange.onLine(1, 2, 5),
  });
});

test("fallbackRange はカーソル位置のトークン範囲を返す", () => {
  const token = Token.create(TOKEN_KINDS.identifier, "注文", 1, 3);
  const cursor = ChunkCursor.create([token]);
  expect(ExpectToken.fallbackRange(cursor, chunkOf([token]))).toEqual(
    token.range,
  );
});

test("fallbackRange は意味トークンが無いときチャンク範囲を返す", () => {
  const chunk = chunkOf([]);
  const cursor = ChunkCursor.create([]);
  expect(ExpectToken.fallbackRange(cursor, chunk)).toEqual(chunk.range);
});

test("reserved は一致する予約語を消費して成功を返す", () => {
  const token = Token.create(TOKEN_KINDS.reserved, "data", 1, 1);
  const cursor = ChunkCursor.create([token]);
  const result = ExpectToken.reserved(
    cursor,
    "data",
    chunkOf([token]),
    "data が必要です",
  );
  expect(result).toMatchObject({
    ok: true,
    value: { value: token },
  });
  expect(result).toEqual(
    expect.objectContaining({
      ok: true,
      value: expect.objectContaining({
        cursor: expect.objectContaining({
          index: expect.any(Number),
        }),
      }),
    }),
  );
});

test("reserved 成功後のカーソルは末尾になる", () => {
  const token = Token.create(TOKEN_KINDS.reserved, "data", 1, 1);
  const result = ExpectToken.reserved(
    ChunkCursor.create([token]),
    "data",
    chunkOf([token]),
    "data が必要です",
  );
  expect(result).toMatchObject({
    ok: true,
    value: {
      cursor: { index: 1 },
    },
  });
});

test("reserved は不一致のとき診断を返す", () => {
  const token = Token.create(TOKEN_KINDS.identifier, "注文", 1, 1);
  const cursor = ChunkCursor.create([token]);
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
  const cursor = ChunkCursor.create([token]);
  expect(ExpectToken.equals(cursor, chunkOf([token]))).toMatchObject({
    ok: true,
    value: { value: token },
  });
});

test("equals は = 以外のとき診断を返す", () => {
  const token = Token.create(TOKEN_KINDS.identifier, "string", 1, 5);
  const cursor = ChunkCursor.create([token]);
  expect(ExpectToken.equals(cursor, chunkOf([token]))).toEqual({
    ok: false,
    error: expect.objectContaining({ message: "= が必要です" }),
  });
});

test("declarationName は data 名の識別子を消費して成功を返す", () => {
  const token = Token.create(TOKEN_KINDS.identifier, "注文ID", 1, 6);
  const cursor = ChunkCursor.create([token]);
  expect(
    ExpectToken.declarationName(cursor, chunkOf([token]), "data"),
  ).toMatchObject({
    ok: true,
    value: { value: token },
  });
});

test("declarationName は data 名が予約語のとき診断を返す", () => {
  const token = Token.create(TOKEN_KINDS.reserved, "AND", 1, 6);
  const cursor = ChunkCursor.create([token]);
  expect(
    ExpectToken.declarationName(cursor, chunkOf([token]), "data"),
  ).toEqual({
    ok: false,
    error: expect.objectContaining({
      message: "データ名の識別子が必要です",
    }),
  });
});
