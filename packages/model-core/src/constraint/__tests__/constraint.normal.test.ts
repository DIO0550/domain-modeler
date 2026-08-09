import { expect, test } from "vitest";
import { NumberRange } from "../../number-range";
import { SourceRange } from "../../source-range";
import { Constraint } from "..";

test("数値範囲制約を生成する", () => {
  const bounds = NumberRange.both(1, 100);
  const range = SourceRange.onLine(1, 20, 26);
  expect(Constraint.numeric(bounds, range)).toEqual({
    kind: "numeric",
    bounds,
    range,
  });
});

test("文字列長制約を生成する", () => {
  const bounds = NumberRange.minOnly(1);
  const range = SourceRange.onLine(2, 30, 40);
  expect(Constraint.length(bounds, range)).toEqual({
    kind: "length",
    bounds,
    range,
  });
});
