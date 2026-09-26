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
  const result = StateMachineSource.add(source, resolution, { part: "terminal", name: "完了", from: "", to: "", event: "" });
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
  expect(Result.isErr(StateMachineSource.add(source, resolution, { part: "state", name: "with space", from: "", to: "", event: "" }))).toBe(true);
  expect(Result.isErr(StateMachineSource.add(source, resolution, { part: "transition", name: "", from: "待機", to: "待機", event: "再試行" }))).toBe(true);
});
