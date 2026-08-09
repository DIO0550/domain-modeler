import { expect, test } from "vitest";
import { ErrorDecl } from "..";
import { SourceRange } from "../../source-range";

test("位置だけを持つエラー宣言を生成する", () => {
  const range = SourceRange.onLine(4, 1, 12);
  expect(ErrorDecl.create(range)).toEqual({ kind: "error", range });
});
