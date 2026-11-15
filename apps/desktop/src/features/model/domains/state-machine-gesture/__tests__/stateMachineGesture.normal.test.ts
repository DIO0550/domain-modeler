import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { StateMachineGesture } from "..";
import { setupStateGesture } from "./stateMachineGesture.test-support";

test.each([
  { point: { x: 103, y: 200 }, moved: false },
  { point: { x: 100, y: 203 }, moved: false },
  { point: { x: 102, y: 202 }, moved: false },
  { point: { x: 104, y: 200 }, moved: true },
  { point: { x: 100, y: 196 }, moved: true },
  { point: { x: 103, y: 203 }, moved: true },
])("画面上4px未満の手ぶれでは状態を移動しない: $point", ({ point, moved }) => {
  const initial = setupStateGesture();
  const next = StateMachineGesture.move(initial, point);

  expect(
    StateMachineGesture.nodePosition(Option.some(next), initial.source).some,
  ).toBe(moved);
});

test("状態の移動は軸ごとの倍率で画面座標からモデル座標へ変換する", () => {
  const initial = setupStateGesture();
  const next = StateMachineGesture.move(initial, { x: 110, y: 180 });

  expect(
    StateMachineGesture.nodePosition(Option.some(next), initial.source),
  ).toEqual(Option.some({ name: "待機", point: { x: -30, y: 70 } }));
});

test("一度ドラッグを開始したら開始点に戻っても移動操作を維持する", () => {
  const initial = setupStateGesture();
  const moved = StateMachineGesture.move(initial, { x: 110, y: 200 });
  const returned = StateMachineGesture.move(moved, initial.start);

  expect(
    StateMachineGesture.nodePosition(Option.some(returned), initial.source),
  ).toEqual(Option.some({ name: "待機", point: initial.origin }));
});

test("空白をドラッグするとポインターへ追従する方向に表示範囲を移す", () => {
  const initial = setupStateGesture({ target: { kind: "canvas" } });
  const moved = StateMachineGesture.move(initial, { x: 110, y: 180 });

  expect(StateMachineGesture.pan(Option.some(moved), initial.source)).toEqual(
    Option.some({ x: -20, y: 10 }),
  );
  expect(
    StateMachineGesture.nodePosition(Option.some(moved), initial.source),
  ).toEqual(Option.none());
});

test("操作開始後に文書が変わった場合は古いドラッグの位置を適用しない", () => {
  const initial = setupStateGesture();
  const moved = StateMachineGesture.move(initial, { x: 110, y: 180 });

  expect(
    StateMachineGesture.nodePosition(
      Option.some(moved),
      `${initial.source}\n  state: 完了`,
    ),
  ).toEqual(Option.none());
});

test("操作開始後に文書が変わった場合は古い空白ドラッグを適用しない", () => {
  const initial = setupStateGesture({ target: { kind: "canvas" } });
  const moved = StateMachineGesture.move(initial, { x: 110, y: 180 });

  expect(
    StateMachineGesture.pan(
      Option.some(moved),
      `${initial.source}\n  state: 完了`,
    ),
  ).toEqual(Option.none());
});

test("ポインター操作がない場合は位置も表示範囲も変更しない", () => {
  expect(StateMachineGesture.nodePosition(Option.none(), "")).toEqual(
    Option.none(),
  );
  expect(StateMachineGesture.pan(Option.none(), "")).toEqual(Option.none());
});
