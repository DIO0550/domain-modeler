import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../../domains/analyzed-model";
import { StateMachineGraph } from "../../../domains/state-machine-graph";
import { createStateMachineDraftRenderer } from "./useStateMachineDraft.test-support";

const drafts = createStateMachineDraftRenderer();
afterEach(() => drafts.unmountAll());

const source = `state-machine 注文 =
  initial: 待機
  state: 待機
state-machine 返金 =
  initial: 申請
  state: 申請`;

test("不正な状態名から修正すると対象マシンの DSL を1回更新する", () => {
  const resolution = AnalyzedModel.create(source).stateMachines[0];
  expect(resolution).toBeDefined();
  if (resolution === undefined) { return; }
  const draft = drafts.render(source, { kind: "part", part: "state", resolution });
  act(() => draft.latest.current?.changeField("name", "with space"));
  act(() => draft.latest.current?.submit());
  expect(draft.latest.current?.error).toBe("有効な状態名を入力してください");
  expect(draft.source()).toBe(source);

  act(() => draft.latest.current?.changeField("name", "保留"));
  act(() => draft.latest.current?.submit());
  expect(draft.source()).toContain("  state: 保留\nstate-machine 返金");
  expect(draft.latest.current?.fields.name).toBe("");
  expect(draft.latest.current?.error).toBe("");
});

test("空の名前を拒否し、正しいマシン名では同じ文書へ新規宣言する", () => {
  const draft = drafts.render("data ID = string", { kind: "machine", definitions: AnalyzedModel.create("data ID = string").definitions });
  act(() => draft.latest.current?.submit());
  expect(draft.latest.current?.error).toBe("有効なマシン名を入力してください");
  expect(draft.source()).toBe("data ID = string");

  act(() => draft.latest.current?.changeField("name", "注文"));
  act(() => draft.latest.current?.submit());
  expect(draft.source()).toContain("state-machine 注文 =");
  expect(draft.latest.current?.fields.name).toBe("");
});

test("遷移の追加は直前に選んだ状態を遷移元にし、終端状態は遷移元の候補にしない", () => {
  const machine = `state-machine 注文 =
  initial: 待機
  state: 待機
  state: 処理中
  state: 完了 terminal`;
  const resolution = AnalyzedModel.create(machine).stateMachines[0];
  expect(resolution).toBeDefined();
  if (resolution === undefined) { return; }
  const draft = drafts.render(machine, { kind: "part", part: "transition", resolution, origin: Option.some("処理中"), destination: Option.none() });
  expect(draft.latest.current?.options).toEqual({ from: ["待機", "処理中"], to: ["待機", "処理中", "完了"] });
  expect(draft.latest.current?.fields).toMatchObject({ from: "処理中", to: "待機" });

  act(() => draft.latest.current?.changeField("to", "完了"));
  act(() => draft.latest.current?.changeField("event", "確定"));
  act(() => draft.latest.current?.submit());
  expect(draft.source()).toContain("  transition: 処理中 -> 完了 on 確定");
});

test("遷移元の指定がない、または終端状態なら先頭の非終端状態を遷移元にする", () => {
  const machine = `state-machine 注文 =
  state: 待機
  state: 完了 terminal`;
  const resolution = AnalyzedModel.create(machine).stateMachines[0];
  expect(resolution).toBeDefined();
  if (resolution === undefined) { return; }
  const unspecified = drafts.render(machine, { kind: "part", part: "transition", resolution, origin: Option.none(), destination: Option.none() });
  expect(unspecified.latest.current?.fields).toMatchObject({ from: "待機", to: "完了" });
  const terminal = drafts.render(machine, { kind: "part", part: "transition", resolution, origin: Option.some("完了"), destination: Option.none() });
  expect(terminal.latest.current?.fields).toMatchObject({ from: "待機", to: "完了" });
});

test("追加に成功したときだけ追加した要素を通知する", () => {
  const resolution = AnalyzedModel.create(source).stateMachines[0];
  expect(resolution).toBeDefined();
  if (resolution === undefined) { return; }
  const state = drafts.render(source, { kind: "part", part: "state", resolution });
  act(() => state.latest.current?.submit());
  expect(state.created).toEqual([]);
  act(() => state.latest.current?.changeField("name", "保留"));
  act(() => state.latest.current?.submit());
  expect(state.created).toEqual([{ kind: "element", selection: StateMachineGraph.stateSelection("保留") }]);

  const transition = drafts.render(source, { kind: "part", part: "transition", resolution, origin: Option.none(), destination: Option.none() });
  act(() => transition.latest.current?.changeField("event", "再試行"));
  act(() => transition.latest.current?.submit());
  expect(transition.created).toEqual([{ kind: "element", selection: StateMachineGraph.transitionSelection({ from: "待機", to: "待機", event: "再試行" }) }]);

  const machine = drafts.render("data ID = string", { kind: "machine", definitions: AnalyzedModel.create("data ID = string").definitions });
  act(() => machine.latest.current?.changeField("name", "注文"));
  act(() => machine.latest.current?.submit());
  expect(machine.created).toEqual([{ kind: "machine" }]);
});

test("遷移先を指定すると遷移先の初期値になり、自己ループも指定できる", () => {
  const resolution = AnalyzedModel.create(source).stateMachines[0];
  expect(resolution).toBeDefined();
  if (resolution === undefined) { return; }
  const draft = drafts.render(source, {
    kind: "part", part: "transition", resolution, origin: Option.some("待機"), destination: Option.some("待機"),
  });
  expect(draft.latest.current?.fields).toMatchObject({ from: "待機", to: "待機" });
  act(() => draft.latest.current?.changeField("event", "再試行"));
  act(() => draft.latest.current?.submit());
  expect(draft.source()).toContain("  transition: 待機 -> 待機 on 再試行");
});
