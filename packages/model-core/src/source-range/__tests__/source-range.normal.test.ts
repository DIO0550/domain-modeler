import { expect, test } from "vitest";
import { SourceRange } from "..";

test("同一行の範囲を start/end の桁で生成する", () => {
  expect(SourceRange.onLine(3, 2, 8)).toEqual({
    startLine: 3,
    startColumn: 2,
    endLine: 3,
    endColumn: 8,
  });
});

test("空の範囲は開始桁と終了桁が一致する", () => {
  expect(SourceRange.onLine(1, 5, 5)).toEqual({
    startLine: 1,
    startColumn: 5,
    endLine: 1,
    endColumn: 5,
  });
});
