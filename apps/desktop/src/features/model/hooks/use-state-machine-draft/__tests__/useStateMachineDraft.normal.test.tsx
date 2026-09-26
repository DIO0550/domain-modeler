import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { AnalyzedModel } from "../../../domains/analyzed-model";
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
  const draft = drafts.render("data ID = string", { kind: "machine" });
  act(() => draft.latest.current?.submit());
  expect(draft.latest.current?.error).toBe("有効なマシン名を入力してください");
  expect(draft.source()).toBe("data ID = string");

  act(() => draft.latest.current?.changeField("name", "注文"));
  act(() => draft.latest.current?.submit());
  expect(draft.source()).toContain("state-machine 注文 =");
  expect(draft.latest.current?.fields.name).toBe("");
});
