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

test("両端付き範囲は 下限..上限 の構文になる", () => {
  expect(NumberRange.toSource(NumberRange.both(1, 100))).toBe("1..100");
});

test("下限のみの範囲は 下限.. の構文になる", () => {
  expect(NumberRange.toSource(NumberRange.minOnly(1))).toBe("1..");
});

test("上限のみの範囲は ..上限 の構文になる", () => {
  expect(NumberRange.toSource(NumberRange.maxOnly(100))).toBe("..100");
});

test("10の21乗の下限は指数表記せず桁を並べる", () => {
  expect(NumberRange.toSource(NumberRange.minOnly(1e21))).toBe(
    "1000000000000000000000..",
  );
});
