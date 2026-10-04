import { expect, test } from "vitest";
import { Result } from "@domain-modeler/canvas-core";
import { StateMachineGraph } from "../../state-machine-graph";
import { StateMachineSource } from "..";
import { machine, position } from "./stateMachinePlacement.test-support";

const source = `state-machine 注文 =
  initial: 待機
  state: 待機 // 説明 @canvas-position(v1, -20, 200)
  state: 完了 terminal // @canvas-position(v1, 500, 200)
  transition: 待機 -> 完了 on 確定 // コメント
  transition: 待機 -> 待機 on 継続
state-machine 返金 =
  state: 待機`;

test.each(["\n", "\r\n"])("状態名編集は初期・出入遷移・自己ループと座標を保ち、別マシンを変更しない (%j)", (newline) => {
  const text = source.split("\n").join(newline);
  const renamed = Result.unwrap(StateMachineSource.rename(text, machine(text), { selection: StateMachineGraph.stateSelection("待機"), name: "保留" }));
  expect(renamed).toContain(`initial: 保留${newline}`);
  expect(renamed).toContain(`state: 保留 // 説明 @canvas-position(v1, -20, 200)${newline}`);
  expect(renamed).toContain(`transition: 保留 -> 完了 on 確定 // コメント${newline}`);
  expect(renamed).toContain(`transition: 保留 -> 保留 on 継続${newline}`);
  expect(renamed).toContain(`state-machine 返金 =${newline}  state: 待機`);
  expect(position(renamed, "保留")).toEqual(position(text, "待機"));
});

test("座標コメントのない文書でも名前の並び替えで状態が移動しない", () => {
  const text = "state-machine 注文 =\n  state: A\n  state: B";
  const renamed = Result.unwrap(StateMachineSource.rename(text, machine(text), { selection: StateMachineGraph.stateSelection("A"), name: "Z" }));
  expect(position(renamed, "Z")).toEqual(position(text, "A"));
  expect(position(renamed, "B")).toEqual(position(text, "B"));
});

test("同じ端点間の遷移が複数あっても対象イベントだけを書き換える", () => {
  const text = source.replace("state-machine 返金", "  transition: 待機 -> 完了 on 別イベント\nstate-machine 返金");
  const renamed = Result.unwrap(StateMachineSource.rename(text, machine(text), {
    selection: StateMachineGraph.transitionSelection({ from: "待機", to: "完了", event: "確定" }), name: "承認",
  }));
  expect(renamed).toBe(text.replace("on 確定", "on 承認"));
});

test.each(["", "完了", "空 白"])("状態名 %j は既存の検証で拒否する", (name) => {
  expect(StateMachineSource.rename(source, machine(source), { selection: StateMachineGraph.stateSelection("待機"), name }).ok).toBe(false);
});

test("変更のない名前確定では配置コメントのない文書を書き換えない", () => {
  const text = "state-machine 注文 =\n  state: A";
  expect(StateMachineSource.rename(text, machine(text), { selection: StateMachineGraph.stateSelection("A"), name: "A" })).toEqual(Result.ok(text));
});

test("不正な座標コメントや未解決参照の状態を名前編集で上書きしない", () => {
  const invalid = source.replace("@canvas-position(v1, -20, 200)", "@canvas-position(v2, 1, 2)");
  expect(StateMachineSource.rename(invalid, machine(invalid), { selection: StateMachineGraph.stateSelection("待機"), name: "保留" }).ok).toBe(false);
  const missing = source.replace("state-machine 返金", "  transition: 待機 -> 未定義 on 失敗\nstate-machine 返金");
  expect(StateMachineSource.rename(missing, machine(missing), { selection: StateMachineGraph.stateSelection("未定義"), name: "保留" }).ok).toBe(false);
});
