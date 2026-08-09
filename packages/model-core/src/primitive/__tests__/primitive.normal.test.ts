import { expect, test } from "vitest";
import { PRIMITIVES, Primitive } from "..";

test.each(Object.values(PRIMITIVES))(
  "PRIMITIVES の %s を Primitive.is が受け入れる",
  (value) => {
    expect(Primitive.is(value)).toBe(true);
  },
);

test("未知の文字列はプリミティブ型ではない", () => {
  expect(Primitive.is("注文ID")).toBe(false);
});

test("予約語 data はプリミティブ型ではない", () => {
  expect(Primitive.is("data")).toBe(false);
});
