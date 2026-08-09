import { expect, test } from "vitest";
import { TOKEN_KINDS, Token } from "..";

test("Token.create は文字列長に応じた SourceRange を付与する", () => {
  expect(Token.create(TOKEN_KINDS.identifier, "注文ID", 2, 5)).toEqual({
    kind: TOKEN_KINDS.identifier,
    text: "注文ID",
    range: {
      startLine: 2,
      startColumn: 5,
      endLine: 2,
      endColumn: 9,
    },
  });
});

test("空文字トークンは開始桁と終了桁が一致する", () => {
  expect(Token.create(TOKEN_KINDS.blankLine, "", 1, 1)).toEqual({
    kind: TOKEN_KINDS.blankLine,
    text: "",
    range: {
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 1,
    },
  });
});

test.each([
  TOKEN_KINDS.comment,
  TOKEN_KINDS.blankLine,
  TOKEN_KINDS.indent,
  TOKEN_KINDS.reserved,
  TOKEN_KINDS.identifier,
  TOKEN_KINDS.equals,
  TOKEN_KINDS.rangeDots,
  TOKEN_KINDS.number,
])("TOKEN_KINDS の %s を kind に持てる", (kind) => {
  expect(Token.create(kind, "x", 1, 1).kind).toBe(kind);
});
