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

test("2つの範囲を包含する最小範囲を span で生成する", () => {
  const start = SourceRange.onLine(1, 1, 5);
  const end = SourceRange.onLine(3, 2, 8);
  expect(SourceRange.span(start, end)).toEqual({
    startLine: 1,
    startColumn: 1,
    endLine: 3,
    endColumn: 8,
  });
});

test("同一行の範囲はその行を含み前後の行は含まない", () => {
  const range = SourceRange.onLine(2, 3, 8);
  expect(SourceRange.coversLine(range, 2)).toBe(true);
  expect(SourceRange.coversLine(range, 1)).toBe(false);
  expect(SourceRange.coversLine(range, 3)).toBe(false);
});

test("複数行の範囲は両端の行を含む", () => {
  const range = SourceRange.span(
    SourceRange.onLine(2, 1, 5),
    SourceRange.onLine(4, 2, 3),
  );
  expect(SourceRange.coversLine(range, 2)).toBe(true);
  expect(SourceRange.coversLine(range, 3)).toBe(true);
  expect(SourceRange.coversLine(range, 4)).toBe(true);
  expect(SourceRange.coversLine(range, 1)).toBe(false);
  expect(SourceRange.coversLine(range, 5)).toBe(false);
});

test("空範囲でも開始行を含む", () => {
  expect(SourceRange.coversLine(SourceRange.onLine(4, 1, 1), 4)).toBe(true);
});
