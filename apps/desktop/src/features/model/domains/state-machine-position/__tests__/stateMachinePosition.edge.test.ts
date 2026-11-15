import { expect, test } from "vitest";
import { StateMachinePosition } from "..";

test.each([
  { x: Number.NaN, y: 0 },
  { x: 0, y: Number.NaN },
  { x: Number.POSITIVE_INFINITY, y: 0 },
  { x: 0, y: Number.NEGATIVE_INFINITY },
  { x: 1_000_001, y: 0 },
  { x: 0, y: -1_000_001 },
])("非有限数または範囲外の座標は作成も書込も拒否する ($x, $y)", (point) => {
  expect(StateMachinePosition.create(point).ok).toBe(false);
  expect(StateMachinePosition.write("  state: 待機 // 説明", point).ok).toBe(
    false,
  );
});

test.each([
  "@canvas-position(v2, 1, 2)",
  "@canvas-position(v1, , 2)",
  "@canvas-position(v1, 1, )",
  "@canvas-position(v1, NaN, 2)",
  "@canvas-position(v1, 1, Infinity)",
  "@canvas-position(v1, 1000001, 2)",
  "@canvas-position(v1, 1, -1000001)",
  "@canvas-position(v1, 1, 2) 後続テキスト",
  "@canvas-position(v1, 1, 2) @canvas-position(v1, 3, 4)",
])("不正な配置コメントは読込と上書きを拒否する: %s", (annotation) => {
  const line = `  state: 待機 // 説明 ${annotation}`;

  expect(StateMachinePosition.read(line).ok).toBe(false);
  expect(StateMachinePosition.write(line, { x: 10, y: 20 }).ok).toBe(false);
});
