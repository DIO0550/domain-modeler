import { expect, test } from "vitest";
import { Result } from "@domain-modeler/model-core";
import { AnalyzedModel } from "../../analyzed-model";
import { StateMachineSource } from "..";

test("別の宣言の前へ状態を追加して DSL とグラフを同期する", () => {
  const source = `state-machine 注文 =
  initial: 待機
  state: 待機

data ID = string`;
  const resolution = AnalyzedModel.create(source).stateMachines[0];
  expect(resolution).toBeDefined();
  if (resolution === undefined) { return; }
  const result = StateMachineSource.add(source, resolution, { part: "state", name: "完了", initial: false, terminal: true });
  expect(Result.isOk(result)).toBe(true);
  if (Result.isErr(result)) { return; }
  expect(result.value).toContain("  state: 完了 terminal\n\ndata ID");
  expect(AnalyzedModel.create(result.value).stateMachines[0]?.machine.states.map((state) => state.name)).toEqual(["待機", "完了"]);
});

test("不正な識別子と重複遷移は文書を変更しない", () => {
  const source = `state-machine 注文 =
  initial: 待機
  state: 待機
  transition: 待機 -> 待機 on 再試行`;
  const resolution = AnalyzedModel.create(source).stateMachines[0];
  expect(resolution).toBeDefined();
  if (resolution === undefined) { return; }
  expect(Result.isErr(StateMachineSource.add(source, resolution, { part: "state", name: "with space", initial: false, terminal: false }))).toBe(true);
  expect(Result.isErr(StateMachineSource.add(source, resolution, { part: "transition", from: "待機", to: "待機", event: "再試行" }))).toBe(true);
});

test("初期状態として追加すると初期行を書き、既存の初期状態は置き換える", () => {
  const empty = `state-machine 注文 =
  state: 待機`;
  const emptyResolution = AnalyzedModel.create(empty).stateMachines[0];
  expect(emptyResolution).toBeDefined();
  if (emptyResolution === undefined) { return; }
  const added = StateMachineSource.add(empty, emptyResolution, { part: "state", name: "受付", initial: true, terminal: true });
  expect(added).toEqual(Result.ok(`state-machine 注文 =
  state: 待機
  initial: 受付
  state: 受付 terminal`));

  const source = `state-machine 注文 =
  initial: 待機 // 開始
  state: 待機

data ID = string`;
  const resolution = AnalyzedModel.create(source).stateMachines[0];
  expect(resolution).toBeDefined();
  if (resolution === undefined) { return; }
  const replaced = StateMachineSource.add(source, resolution, { part: "state", name: "受付", initial: true, terminal: false });
  expect(replaced).toEqual(Result.ok(`state-machine 注文 =
  initial: 受付 // 開始
  state: 待機
  state: 受付

data ID = string`));
  if (Result.isErr(replaced)) { return; }
  expect(AnalyzedModel.create(replaced.value).stateMachines[0]?.machine.initials.map((initial) => initial.name)).toEqual(["受付"]);
});

test("初期状態が重複している場合は初期状態として追加しない", () => {
  const source = `state-machine 注文 =
  initial: 待機
  initial: 待機
  state: 待機`;
  const resolution = AnalyzedModel.create(source).stateMachines[0];
  expect(resolution).toBeDefined();
  if (resolution === undefined) { return; }
  expect(StateMachineSource.add(source, resolution, { part: "state", name: "受付", initial: true, terminal: false }))
    .toEqual(Result.err("初期状態の重複をモデル定義で修正してください"));
});
