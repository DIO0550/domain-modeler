import { expect, test } from "vitest";
import { ArrayEx } from "../ArrayEx";

test.each([
  { items: ["a", "b", "c"] as const, index: 0, expected: "a" },
  { items: ["a", "b", "c"] as const, index: 2, expected: "c" },
  { items: ["a", "b", "c"] as const, index: 3, expected: "a" },
  { items: ["a", "b", "c"] as const, index: 4, expected: "b" },
  { items: ["a", "b", "c"] as const, index: -1, expected: "c" },
  { items: ["a", "b", "c"] as const, index: -2, expected: "b" },
])(
  "ArrayEx.atWrapped($items, $index) は $expected になる",
  ({
    items,
    index,
    expected,
  }: {
    items: readonly string[];
    index: number;
    expected: string;
  }) => {
    expect(ArrayEx.atWrapped(items, index)).toBe(expected);
  },
);

test("空配列では循環位置の要素は無い", () => {
  expect(ArrayEx.atWrapped([], 0)).toBeUndefined();
});

test("先に現れた値を残して重複を除く", () => {
  expect(ArrayEx.unique(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
});

test("空配列の unique は空のまま", () => {
  expect(ArrayEx.unique([])).toEqual([]);
});
