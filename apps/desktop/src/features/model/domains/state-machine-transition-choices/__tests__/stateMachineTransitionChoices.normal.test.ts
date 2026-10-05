import { expect, test } from "vitest";
import { AnalyzedModel } from "../../analyzed-model";
import { StateMachineTransitionChoices } from "..";

test.each([
  {
    name: "終端状態は遷移先だけの候補になる",
    source:
      "state-machine 注文 =\n  state: 完了 terminal\n  state: 待機\n  state: 処理中",
    expected: { from: ["待機", "処理中"], to: ["完了", "待機", "処理中"] },
  },
  {
    name: "同じ状態名は宣言順を保って一つの候補になる",
    source:
      "state-machine 注文 =\n  state: 待機\n  state: 処理中\n  state: 待機",
    expected: { from: ["待機", "処理中"], to: ["待機", "処理中"] },
  },
  {
    name: "同名の宣言に終端状態が含まれると遷移元の候補にならない",
    source:
      "state-machine 注文 =\n  state: 完了\n  state: 待機\n  state: 完了 terminal",
    expected: { from: ["待機"], to: ["完了", "待機"] },
  },
  {
    name: "状態がないマシンでは遷移元と遷移先の候補が空になる",
    source: "state-machine 注文 =",
    expected: { from: [], to: [] },
  },
  {
    name: "終端状態だけのマシンでは遷移元の候補だけが空になる",
    source: "state-machine 注文 =\n  state: 完了 terminal",
    expected: { from: [], to: ["完了"] },
  },
])("$name", ({ source, expected }) => {
  const { machine } = AnalyzedModel.create(source).stateMachines[0]!;

  expect(StateMachineTransitionChoices.create(machine)).toEqual(expected);
});

test.each([
  {
    name: "候補内の選択は先頭でなくても維持する",
    choices: { from: ["待機", "処理中"], to: ["待機", "完了"] },
    selected: { from: "処理中", to: "完了" },
    expected: { from: "処理中", to: "完了" },
  },
  {
    name: "遷移元が候補から消えた場合は遷移先を維持して遷移元だけを先頭へ戻す",
    choices: { from: ["待機", "処理中"], to: ["待機", "完了"] },
    selected: { from: "削除済み", to: "完了" },
    expected: { from: "待機", to: "完了" },
  },
  {
    name: "遷移先が候補から消えた場合は遷移元を維持して遷移先だけを先頭へ戻す",
    choices: { from: ["待機", "処理中"], to: ["待機", "完了"] },
    selected: { from: "処理中", to: "削除済み" },
    expected: { from: "処理中", to: "待機" },
  },
  {
    name: "未選択の場合はそれぞれの先頭候補を選ぶ",
    choices: { from: ["待機"], to: ["完了", "待機"] },
    selected: { from: "", to: "" },
    expected: { from: "待機", to: "完了" },
  },
  {
    name: "候補が両方空の場合は以前の選択を空欄へ戻す",
    choices: { from: [], to: [] },
    selected: { from: "待機", to: "完了" },
    expected: { from: "", to: "" },
  },
  {
    name: "終端状態だけの場合は遷移元を空欄にして遷移先を維持する",
    choices: { from: [], to: ["完了"] },
    selected: { from: "完了", to: "完了" },
    expected: { from: "", to: "完了" },
  },
])("$name", ({ choices, selected, expected }) => {
  expect(StateMachineTransitionChoices.selection(choices, selected)).toEqual(
    expected,
  );
});
