import { expect, test } from "vitest";
import { Point } from "..";

test("点と線分の最短距離を取得する", () => {
  expect(
    Point.distanceFromSegment(
      { x: 5, y: 4 },
      { from: { x: 0, y: 0 }, to: { x: 10, y: 0 } },
    ),
  ).toBe(4);
});

test("始点と終点が同じ線分ではその点との距離を取得する", () => {
  expect(
    Point.distanceFromSegment(
      { x: 3, y: 4 },
      { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } },
    ),
  ).toBe(5);
});
