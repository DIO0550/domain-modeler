import { expect, test } from "vitest";
import { TOKEN_KINDS, Token } from "../../../token";
import { ChunkCursor } from "..";

test("先頭の意味トークンを peek で返す", () => {
  const cursor = new ChunkCursor([
    Token.create(TOKEN_KINDS.identifier, "注文", 1, 1),
  ]);
  expect(cursor.peek()).toMatchObject({
    kind: TOKEN_KINDS.identifier,
    text: "注文",
  });
  expect(cursor.atEnd).toBe(false);
});

test("indent と comment を読み飛ばして意味トークンを返す", () => {
  const cursor = new ChunkCursor([
    Token.create(TOKEN_KINDS.indent, "  ", 1, 1),
    Token.create(TOKEN_KINDS.comment, "// note", 1, 3),
    Token.create(TOKEN_KINDS.identifier, "顧客", 1, 11),
  ]);
  expect(cursor.peek()).toMatchObject({ text: "顧客" });
});

test("blankLine を読み飛ばして次の意味トークンを返す", () => {
  const cursor = new ChunkCursor([
    Token.create(TOKEN_KINDS.blankLine, "", 1, 1),
    Token.create(TOKEN_KINDS.reserved, "AND", 2, 1),
  ]);
  expect(cursor.peek()).toMatchObject({ text: "AND" });
});

test("advance は意味トークンを消費して次へ進む", () => {
  const cursor = new ChunkCursor([
    Token.create(TOKEN_KINDS.identifier, "注文", 1, 1),
    Token.create(TOKEN_KINDS.reserved, "OR", 1, 4),
  ]);
  expect(cursor.advance()).toMatchObject({ text: "注文" });
  expect(cursor.peek()).toMatchObject({ text: "OR" });
});

test("peekAt は現在位置から n 個先の意味トークンを返す", () => {
  const cursor = new ChunkCursor([
    Token.create(TOKEN_KINDS.identifier, "int", 1, 1),
    Token.create(TOKEN_KINDS.indent, " ", 1, 4),
    Token.create(TOKEN_KINDS.reserved, "constrained", 1, 5),
    Token.create(TOKEN_KINDS.number, "1", 1, 17),
  ]);
  expect(cursor.peekAt(0)).toMatchObject({ text: "int" });
  expect(cursor.peekAt(1)).toMatchObject({ text: "constrained" });
  expect(cursor.peekAt(2)).toMatchObject({ text: "1" });
  expect(cursor.peekAt(3)).toBeUndefined();
});

test("意味トークンが無いとき atEnd は true になる", () => {
  const cursor = new ChunkCursor([
    Token.create(TOKEN_KINDS.indent, "  ", 1, 1),
    Token.create(TOKEN_KINDS.comment, "// only", 1, 3),
  ]);
  expect(cursor.atEnd).toBe(true);
  expect(cursor.peek()).toBeUndefined();
  expect(cursor.advance()).toBeUndefined();
});
