import { expect, test } from "vitest";
import { NumberEx } from "../NumberEx";

test.each([
  { value: 0, expected: true },
  { value: 1.5, expected: true },
  { value: -10, expected: true },
  { value: Number.MAX_SAFE_INTEGER, expected: true },
  { value: Number.NaN, expected: false },
  { value: Number.POSITIVE_INFINITY, expected: false },
  { value: Number.NEGATIVE_INFINITY, expected: false },
  { value: "1", expected: false },
  { value: null, expected: false },
  { value: undefined, expected: false },
  { value: true, expected: false },
  { value: {}, expected: false },
])(
  "NumberEx.isFinite($value) は $expected になる",
  ({ value, expected }: { value: unknown; expected: boolean }) => {
    expect(NumberEx.isFinite(value)).toBe(expected);
  },
);
