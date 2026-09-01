import { expect, test } from "vitest";
import { Option } from "..";

test("値ありは保持した値を返す", () => {
  const option = Option.some(42);

  expect(option).toEqual({ some: true, value: 42 });
  expect(Option.isSome(option)).toBe(true);
  expect(Option.isNone(option)).toBe(false);
});

test("値なしは値を持たない状態を返す", () => {
  const option = Option.none();

  expect(option).toEqual({ some: false });
  expect(Option.isNone(option)).toBe(true);
  expect(Option.isSome(option)).toBe(false);
});
