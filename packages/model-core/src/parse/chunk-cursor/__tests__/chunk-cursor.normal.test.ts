import { expect, test } from "vitest";
import { TOKEN_KINDS, Token } from "../../../token";
import { ChunkCursor } from "..";

test("先頭の意味トークンを peek で返す", () => {
  const cursor = ChunkCursor.create([
    Token.create(TOKEN_KINDS.identifier, "注文", 1, 1),
  ]);
  expect(ChunkCursor.peek(cursor)).toMatchObject({
    kind: TOKEN_KINDS.identifier,
    text: "注文",
  });
  expect(ChunkCursor.atEnd(cursor)).toBe(false);
});

test("indent と comment を読み飛ばして意味トークンを返す", () => {
  const cursor = ChunkCursor.create([
    Token.create(TOKEN_KINDS.indent, "  ", 1, 1),
    Token.create(TOKEN_KINDS.comment, "// note", 1, 3),
    Token.create(TOKEN_KINDS.identifier, "顧客", 1, 11),
  ]);
  expect(ChunkCursor.peek(cursor)).toMatchObject({ text: "顧客" });
});

test("blankLine を読み飛ばして次の意味トークンを返す", () => {
  const cursor = ChunkCursor.create([
    Token.create(TOKEN_KINDS.blankLine, "", 1, 1),
    Token.create(TOKEN_KINDS.reserved, "AND", 2, 1),
  ]);
  expect(ChunkCursor.peek(cursor)).toMatchObject({ text: "AND" });
});

test("advance は意味トークンを消費した新しいカーソルを返す", () => {
  const cursor = ChunkCursor.create([
    Token.create(TOKEN_KINDS.identifier, "注文", 1, 1),
    Token.create(TOKEN_KINDS.reserved, "OR", 1, 4),
  ]);
  const advanced = ChunkCursor.advance(cursor);
  expect(advanced.token).toMatchObject({ text: "注文" });
  expect(ChunkCursor.peek(advanced.cursor)).toMatchObject({ text: "OR" });
  expect(ChunkCursor.peek(cursor)).toMatchObject({ text: "注文" });
});

test("peekAt は現在位置から n 個先の意味トークンを返す", () => {
  const cursor = ChunkCursor.create([
    Token.create(TOKEN_KINDS.identifier, "int", 1, 1),
    Token.create(TOKEN_KINDS.indent, " ", 1, 4),
    Token.create(TOKEN_KINDS.reserved, "constrained", 1, 5),
    Token.create(TOKEN_KINDS.number, "1", 1, 17),
  ]);
  expect(ChunkCursor.peekAt(cursor, 0)).toMatchObject({ text: "int" });
  expect(ChunkCursor.peekAt(cursor, 1)).toMatchObject({
    text: "constrained",
  });
  expect(ChunkCursor.peekAt(cursor, 2)).toMatchObject({ text: "1" });
  expect(ChunkCursor.peekAt(cursor, 3)).toBeUndefined();
});

test("意味トークンが無いとき atEnd は true になる", () => {
  const cursor = ChunkCursor.create([
    Token.create(TOKEN_KINDS.indent, "  ", 1, 1),
    Token.create(TOKEN_KINDS.comment, "// only", 1, 3),
  ]);
  expect(ChunkCursor.atEnd(cursor)).toBe(true);
  expect(ChunkCursor.peek(cursor)).toBeUndefined();
  expect(ChunkCursor.advance(cursor).token).toBeUndefined();
});
