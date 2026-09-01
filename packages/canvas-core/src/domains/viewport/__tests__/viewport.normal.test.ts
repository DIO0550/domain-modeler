import { expect, test } from "vitest";
import { Viewport } from "..";

test("ワールド座標とスクリーン座標を相互変換する", () => {
  const viewport = { x: 100, y: -50, zoom: 2 };
  const worldPoint = { x: 25, y: 40 };

  const screenPoint = Viewport.worldToScreen(viewport, worldPoint);

  expect(screenPoint).toEqual({ x: 150, y: 30 });
  expect(Viewport.screenToWorld(viewport, screenPoint)).toEqual(worldPoint);
});

test("ワールドサイズとスクリーンサイズを相互変換する", () => {
  const viewport = { x: 100, y: -50, zoom: 2 };
  const worldSize = { width: 80, height: 50 };

  const screenSize = Viewport.worldSizeToScreen(viewport, worldSize);

  expect(screenSize).toEqual({ width: 160, height: 100 });
  expect(Viewport.screenSizeToWorld(viewport, screenSize)).toEqual(worldSize);
});

test("スクリーン座標系の移動量でパンする", () => {
  const viewport = { x: 100, y: -50, zoom: 2 };

  expect(Viewport.pan(viewport, { x: 20, y: -10 })).toEqual({
    x: 120,
    y: -60,
    zoom: 2,
  });
  expect(viewport).toEqual({ x: 100, y: -50, zoom: 2 });
});

test("指定したスクリーン座標を不動点としてズームする", () => {
  const viewport = { x: 100, y: 50, zoom: 2 };
  const fixedPoint = { x: 300, y: 250 };
  const worldPoint = Viewport.screenToWorld(viewport, fixedPoint);

  const next = Viewport.zoomAt(viewport, 3, fixedPoint);

  expect(next).toEqual({ x: 0, y: -50, zoom: 3 });
  expect(Viewport.worldToScreen(next, worldPoint)).toEqual(fixedPoint);
});

test.each([
  { requested: 0.01, expected: 0.1 },
  { requested: 5, expected: 4 },
])(
  "ズーム倍率を許容範囲へクランプする",
  ({ requested, expected }: { requested: number; expected: number }) => {
    const viewport = { x: 0, y: 0, zoom: 1 };
    const fixedPoint = { x: 40, y: 60 };

    const next = Viewport.zoomAt(viewport, requested, fixedPoint);

    expect(next.zoom).toBe(expected);
    expect(
      Viewport.worldToScreen(
        next,
        Viewport.screenToWorld(viewport, fixedPoint),
      ),
    ).toEqual(fixedPoint);
  },
);
