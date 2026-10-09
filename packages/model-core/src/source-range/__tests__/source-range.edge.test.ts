import { expect, test } from "vitest";
import { SourceRange } from "..";

test("範囲の包含は行と桁の境界を使い同一範囲と空範囲を含む", () => {
  const outer = SourceRange.span(
    SourceRange.onLine(2, 5, 10),
    SourceRange.onLine(4, 1, 8),
  );

  expect(SourceRange.contains({ outer, inner: outer })).toBe(true);
  expect(
    SourceRange.contains({ outer, inner: SourceRange.onLine(2, 5, 5) }),
  ).toBe(true);
  expect(
    SourceRange.contains({ outer, inner: SourceRange.onLine(3, 1, 20) }),
  ).toBe(true);
  expect(
    SourceRange.contains({ outer, inner: SourceRange.onLine(2, 4, 8) }),
  ).toBe(false);
  expect(
    SourceRange.contains({ outer, inner: SourceRange.onLine(4, 7, 9) }),
  ).toBe(false);
  expect(
    SourceRange.contains({ outer, inner: SourceRange.onLine(1, 8, 9) }),
  ).toBe(false);
  expect(
    SourceRange.contains({ outer, inner: SourceRange.onLine(5, 1, 2) }),
  ).toBe(false);
});

test("範囲の比較は開始位置を優先し同じ開始位置なら終了位置を比較する", () => {
  const left = SourceRange.onLine(2, 5, 8);

  expect(SourceRange.compare({ left, right: left })).toBe(0);
  expect(
    SourceRange.compare({ left, right: SourceRange.onLine(3, 1, 2) }),
  ).toBeLessThan(0);
  expect(
    SourceRange.compare({ left, right: SourceRange.onLine(2, 6, 8) }),
  ).toBeLessThan(0);
  expect(
    SourceRange.compare({ left, right: SourceRange.onLine(2, 5, 9) }),
  ).toBeLessThan(0);
  expect(
    SourceRange.compare({ left, right: SourceRange.onLine(1, 1, 2) }),
  ).toBeGreaterThan(0);
});
