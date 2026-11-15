import { Result } from "@domain-modeler/model-core";
import { expect, test } from "vitest";
import { StateMachinePosition } from "..";

test.each([
  { x: -1_000_000, y: 1_000_000 },
  { x: 1_000_000, y: -1_000_000 },
  { x: 0, y: 0 },
])("範囲内の座標は負数と境界値を含めて保存できる ($x, $y)", (point) => {
  expect(StateMachinePosition.create(point)).toEqual(Result.ok(point));
});

test("座標を保存すると小数点以下2桁に丸められる", () => {
  expect(StateMachinePosition.create({ x: 123.456, y: -45.678 })).toEqual(
    Result.ok({ x: 123.46, y: -45.68 }),
  );
});

test.each([
  "  state: 待機",
  "  state: 待機 // 支払い待ち",
  "  state: 待機 // 支払い待ち\r",
])("配置コメントのない既存の状態行からは座標を読み出さない: %j", (line) => {
  expect(StateMachinePosition.read(line)).toEqual(Result.ok({ some: false }));
});

test.each([
  {
    line: "  state: 待機",
    expected: "  state: 待機 // @canvas-position(v1, -20.13, 30.46)",
  },
  {
    line: "  state: 待機 // 支払い待ち\r",
    expected:
      "  state: 待機 // 支払い待ち @canvas-position(v1, -20.13, 30.46)\r",
  },
  {
    line: "  state: 待機 // 説明 @canvas-position(v1, 1, 2)\r",
    expected: "  state: 待機 // 説明 @canvas-position(v1, -20.13, 30.46)\r",
  },
])("座標更新は宣言・通常コメント・改行を保持する: $line", ({
  line,
  expected,
}) => {
  const written = Result.unwrap(
    StateMachinePosition.write(line, { x: -20.126, y: 30.456 }),
  );

  expect(written).toBe(expected);
  expect(StateMachinePosition.read(written)).toEqual(
    Result.ok({ some: true, value: { x: -20.13, y: 30.46 } }),
  );
});
