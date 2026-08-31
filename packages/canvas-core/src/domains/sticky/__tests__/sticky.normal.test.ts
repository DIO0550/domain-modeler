import { expect, test } from "vitest";
import { Anchor, Size, Sticky, StickyId, StickyType } from "..";

const sticky = Sticky.create(
  StickyId.create("stk_1"),
  "event",
  "注文済み",
  { x: 10, y: 20 },
  { width: 120, height: 80 },
);

test("既知の付箋種別とアンカーだけを受け付ける", () => {
  expect(StickyType.is("event")).toBe(true);
  expect(StickyType.is("unknown")).toBe(false);
  expect(Anchor.is("left")).toBe(true);
  expect(Anchor.is("center")).toBe(false);
});

test("幅と高さが正のサイズだけを有効とする", () => {
  expect(Size.isValid({ width: 1, height: 1 })).toBe(true);
  expect(Size.isValid({ width: 0, height: 1 })).toBe(false);
  expect(Size.isValid({ width: 1, height: -1 })).toBe(false);
});

test("付箋の中心と各辺のアンカー座標を取得する", () => {
  expect(Sticky.center(sticky)).toEqual({ x: 70, y: 60 });
  expect(Sticky.anchorPoint(sticky, "top")).toEqual({ x: 70, y: 20 });
  expect(Sticky.anchorPoint(sticky, "right")).toEqual({ x: 130, y: 60 });
  expect(Sticky.anchorPoint(sticky, "bottom")).toEqual({ x: 70, y: 100 });
  expect(Sticky.anchorPoint(sticky, "left")).toEqual({ x: 10, y: 60 });
});

test("付箋の境界を含む矩形内だけを含むと判定する", () => {
  expect(Sticky.contains(sticky, { x: 10, y: 20 })).toBe(true);
  expect(Sticky.contains(sticky, { x: 130, y: 100 })).toBe(true);
  expect(Sticky.contains(sticky, { x: 131, y: 100 })).toBe(false);
});
