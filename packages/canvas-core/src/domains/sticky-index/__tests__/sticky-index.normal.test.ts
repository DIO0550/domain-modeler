import { expect, test } from "vitest";
import { Sticky, StickyId } from "../../sticky";
import { StickyIndex } from "../index";

const sticky = Sticky.create(
  StickyId.create("stk_index000000"),
  "actor",
  "利用者",
  { x: 20, y: 40 },
  { width: 120, height: 80 },
);

test("登録したIDの付箋を取得できる", () => {
  const index = StickyIndex.create([sticky]);

  expect(StickyIndex.get(index, sticky.id)).toEqual({
    some: true,
    value: sticky,
  });
});

test("登録されていないIDは値なしになる", () => {
  const index = StickyIndex.create([sticky]);

  expect(StickyIndex.get(index, StickyId.create("stk_missing00000"))).toEqual({
    some: false,
  });
});
