import { expect, test } from "vitest";
import { NumberRange } from "..";

test("両端付き範囲を生成する", () => {
  expect(NumberRange.both(1, 100)).toEqual({
    bound: "both",
    min: 1,
    max: 100,
  });
});

test("下限のみの範囲を生成する", () => {
  expect(NumberRange.minOnly(1)).toEqual({ bound: "minOnly", min: 1 });
});

test("上限のみの範囲を生成する", () => {
  expect(NumberRange.maxOnly(100)).toEqual({ bound: "maxOnly", max: 100 });
});
