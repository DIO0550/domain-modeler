import { expect, test } from "vitest";
import { DependencyPan } from "..";

test("4px未満の手ぶれではパンせず4px以上で画面距離だけ移動する", () => {
  const initial = DependencyPan.start(1, { x: 100, y: 100 });
  const jitter = DependencyPan.move(initial, {
    pointerId: 1,
    point: { x: 103, y: 100 },
  });
  const drag = DependencyPan.move(jitter.pan, {
    pointerId: 1,
    point: { x: 104, y: 100 },
  });
  const continued = DependencyPan.move(drag.pan, {
    pointerId: 1,
    point: { x: 105, y: 100 },
  });

  expect(jitter.delta).toEqual({ x: 0, y: 0 });
  expect(drag.delta).toEqual({ x: 4, y: 0 });
  expect(continued.delta).toEqual({ x: 1, y: 0 });
});

test("押下していない指や別のポインターの移動ではパンしない", () => {
  const initial = DependencyPan.start(1, { x: 100, y: 100 });

  expect(
    DependencyPan.move(initial, { pointerId: 2, point: { x: 200, y: 200 } })
      .pan,
  ).toEqual(initial);
  expect(
    DependencyPan.move(DependencyPan.create(), {
      pointerId: 1,
      point: { x: 200, y: 200 },
    }).delta,
  ).toEqual({ x: 0, y: 0 });
});
