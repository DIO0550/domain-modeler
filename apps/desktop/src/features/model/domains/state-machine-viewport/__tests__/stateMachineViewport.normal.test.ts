import { expect, test } from "vitest";
import { StateMachineViewport } from "..";

test("拡大後も基準点の画面内での割合を維持する", () => {
  const frame = { left: -500, top: -300, width: 960, height: 640 };
  const point = { x: -200, y: 100 };
  const before = StateMachineViewport.panBy(StateMachineViewport.create(), {
    x: 70,
    y: -40,
  });
  const after = StateMachineViewport.zoomBy(
    before,
    2,
    StateMachineViewport.anchor(frame, point),
  );
  const visibleBefore = StateMachineViewport.frame(before, frame);
  const visibleAfter = StateMachineViewport.frame(after, frame);

  expect((point.x - visibleAfter.left) / visibleAfter.width).toBeCloseTo(
    (point.x - visibleBefore.left) / visibleBefore.width,
  );
  expect((point.y - visibleAfter.top) / visibleAfter.height).toBeCloseTo(
    (point.y - visibleBefore.top) / visibleBefore.height,
  );
});

test.each([
  0.001, 100,
])("倍率の上限・下限へ達した後も基準点を維持する: %s", (factor) => {
  const before = StateMachineViewport.panBy(StateMachineViewport.create(), {
    x: -30,
    y: 80,
  });
  const anchor = { x: 110, y: -40 };
  const after = StateMachineViewport.zoomBy(before, factor, anchor);
  const clamped = StateMachineViewport.zoomBy(after, factor, anchor);

  expect(after.zoom).toBe(factor < 1 ? 0.5 : 3);
  expect((anchor.x - after.pan.x) * after.zoom).toBeCloseTo(
    (anchor.x - before.pan.x) * before.zoom,
  );
  expect((anchor.y - after.pan.y) * after.zoom).toBeCloseTo(
    (anchor.y - before.pan.y) * before.zoom,
  );
  expect(clamped).toEqual(after);
});

test("ツールバーのズームはパンした表示中心を維持する", () => {
  const viewport = StateMachineViewport.panBy(StateMachineViewport.create(), {
    x: -100,
    y: 200,
  });
  const zoomed = StateMachineViewport.zoomBy(viewport, 1.25);

  expect(zoomed).toEqual({ zoom: 1.25, pan: { x: -100, y: 200 } });
});
