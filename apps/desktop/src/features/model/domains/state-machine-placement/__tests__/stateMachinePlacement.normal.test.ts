import { Result } from "@domain-modeler/model-core";
import { expect, test } from "vitest";
import { AnalyzedModel } from "../../analyzed-model";
import { StateMachineGraph } from "../../state-machine-graph";
import { StateMachinePlacement } from "..";

test("状態の配置は対象マシンの宣言行だけから読み取る", () => {
  const source = `state-machine 注文 =
  state: 待機 // @canvas-position(v1, -20, 30)
  state: 完了
state-machine 返金 =
  state: 待機 // @canvas-position(v1, 500, 600)`;
  const resolution = AnalyzedModel.create(source).stateMachines[0];

  expect(StateMachinePlacement.read(source, resolution)).toEqual(
    Result.ok({
      [StateMachineGraph.stateSelection("待機").id]: { x: -20, y: 30 },
    }),
  );
});

test("一部の状態だけに座標を書き込んでも他の状態と別マシンは変更しない", () => {
  const source = `state-machine 注文 =
  state: 待機 // 説明
  state: 完了 // @canvas-position(v1, 500, 30)
state-machine 返金 =
  state: 待機`;
  const resolution = AnalyzedModel.create(source).stateMachines[0];
  const updated = Result.unwrap(
    StateMachinePlacement.write(source, resolution, {
      [StateMachineGraph.stateSelection("待機").id]: { x: -20, y: 30 },
      [StateMachineGraph.stateSelection("未定義").id]: { x: 10, y: 20 },
    }),
  );

  expect(updated).toBe(
    source.replace(
      "state: 待機 // 説明",
      "state: 待機 // 説明 @canvas-position(v1, -20, 30)",
    ),
  );
});

test("保存済み状態に未注釈の状態を追加しても保存済みの位置は変わらない", () => {
  const source = `state-machine 注文 =
  state: 待機 // @canvas-position(v1, -200, -100)
  state: 完了`;
  const resolution = AnalyzedModel.create(source).stateMachines[0];
  const layout = Result.unwrap(
    StateMachinePlacement.layout(source, resolution),
  );
  const waiting = layout.nodes[StateMachineGraph.stateSelection("待機").id];
  const completed = layout.nodes[StateMachineGraph.stateSelection("完了").id];

  expect(waiting).toEqual({ x: -200, y: -100 });
  expect(completed.x).toBeGreaterThan(waiting.x);
});

test("重複状態には位置を書き込まず、修正を求めるエラーを返す", () => {
  const source = "state-machine 注文 =\n  state: 待機\n  state: 待機";
  const resolution = AnalyzedModel.create(source).stateMachines[0];

  expect(
    StateMachinePlacement.write(source, resolution, {
      [StateMachineGraph.stateSelection("待機").id]: { x: 10, y: 20 },
    }),
  ).toEqual(Result.err("状態名の重複をモデル定義で修正してください"));
});

test.each([
  { name: "待機", movable: true },
  { name: "重複", movable: false },
  { name: "未定義", movable: false },
])("一意に宣言された状態だけを移動できる: $name", ({ name, movable }) => {
  const source =
    "state-machine 注文 =\n  state: 待機\n  state: 重複\n  state: 重複\n  transition: 待機 -> 未定義 on 失敗";
  const resolution = AnalyzedModel.create(source).stateMachines[0];

  expect(StateMachinePlacement.isMovable(resolution, name)).toBe(movable);
});

test("新しい状態名は宣言だけでなく初期指定と未定義の遷移先も避ける", () => {
  const source =
    "state-machine 注文 =\n  initial: 状態1\n  state: 状態2\n  transition: 状態2 -> 状態3 on 進む";
  const resolution = AnalyzedModel.create(source).stateMachines[0];

  expect(StateMachinePlacement.nextName(resolution)).toBe("状態4");
});
