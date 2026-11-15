import { Result, SourceRange } from "@domain-modeler/model-core";
import { expect, test } from "vitest";
import { AnalyzedModel } from "../../analyzed-model";
import { StateMachineGraph } from "../../state-machine-graph";
import { StateMachineSource } from "..";

test("空の文書には最初のマシン宣言だけを作成する", () => {
  expect(StateMachineSource.create("", "注文")).toEqual(
    Result.ok("state-machine 注文 =\n"),
  );
});

test.each([
  "\n",
  "\r\n",
])("初期行のない状態を初期に変更しても終端属性と改行を保つ (%j)", (newline) => {
  const source = [
    "state-machine 注文 =",
    "  state: 待機 // 説明",
    "  state: 完了 terminal",
  ].join(newline);
  const resolution = AnalyzedModel.create(source).stateMachines[0];
  const updated = Result.unwrap(
    StateMachineSource.updateState(source, resolution, {
      oldName: "待機",
      name: "開始",
      initial: true,
      terminal: false,
    }),
  );

  expect(updated).toBe(
    [
      "state-machine 注文 =",
      "  initial: 開始",
      "  state: 開始 // 説明",
      "  state: 完了 terminal",
    ].join(newline),
  );
});

test("初期状態の指定を外しながらリネームすると初期行を削除して遷移参照は更新する", () => {
  const source = `state-machine 注文 =
  initial: 待機 // 初期
  state: 待機 // 説明
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定`;
  const resolution = AnalyzedModel.create(source).stateMachines[0];
  const updated = Result.unwrap(
    StateMachineSource.updateState(source, resolution, {
      oldName: "待機",
      name: "保留",
      initial: false,
      terminal: false,
    }),
  );

  expect(updated).toBe(`state-machine 注文 =
  state: 保留 // 説明
  state: 完了 terminal
  transition: 保留 -> 完了 on 確定`);
});

test("初期指定が重複している文書では別の状態を初期に変更しない", () => {
  const source =
    "state-machine 注文 =\n  initial: 待機\n  initial: 待機\n  state: 待機\n  state: 完了";
  const resolution = AnalyzedModel.create(source).stateMachines[0];

  expect(
    StateMachineSource.updateState(source, resolution, {
      oldName: "完了",
      name: "完了",
      initial: true,
      terminal: false,
    }),
  ).toEqual(Result.err("初期状態の重複をモデル定義で修正してください"));
});

test.each([
  { from: "未定義", to: "完了" },
  { from: "待機", to: "未定義" },
])("未定義の状態 $from -> $to へ遷移を追加しない", ({ from, to }) => {
  const source = "state-machine 注文 =\n  state: 待機\n  state: 完了";
  const resolution = AnalyzedModel.create(source).stateMachines[0];

  expect(
    StateMachineSource.add(source, resolution, {
      part: "transition",
      from,
      to,
      event: "確定",
    }),
  ).toEqual(Result.err("マシン内の状態を遷移元と遷移先に指定してください"));
});

test.each([
  {
    from: "",
    to: "完了",
    event: "確定",
    message: "遷移元・遷移先・イベント名を入力してください",
  },
  {
    from: "待機",
    to: "空 白",
    event: "確定",
    message: "遷移元・遷移先・イベント名を入力してください",
  },
  {
    from: "待機",
    to: "完了",
    event: "",
    message: "遷移元・遷移先・イベント名を入力してください",
  },
  {
    from: "未定義",
    to: "完了",
    event: "確定",
    message: "マシン内の状態を遷移元と遷移先に指定してください",
  },
  {
    from: "待機",
    to: "未定義",
    event: "確定",
    message: "マシン内の状態を遷移元と遷移先に指定してください",
  },
])("遷移の編集で不正な端点やイベントは確定しない ($from -> $to on $event)", ({
  from,
  to,
  event,
  message,
}) => {
  const source =
    "state-machine 注文 =\n  state: 待機\n  state: 完了\n  transition: 待機 -> 完了 on 確定";
  const resolution = AnalyzedModel.create(source).stateMachines[0];

  expect(
    StateMachineSource.updateTransition(source, resolution, {
      range: resolution.machine.transitions[0].range,
      from,
      to,
      event,
    }),
  ).toEqual(Result.err(message));
});

test("削除済みの遷移を編集しようとしても他の遷移は変更しない", () => {
  const source = "state-machine 注文 =\n  state: 待機\n  state: 完了";
  const resolution = AnalyzedModel.create(source).stateMachines[0];

  expect(
    StateMachineSource.updateTransition(source, resolution, {
      range: SourceRange.onLine(4, 1, 10),
      from: "待機",
      to: "完了",
      event: "確定",
    }),
  ).toEqual(Result.err("編集する遷移を特定できません"));
});

test("削除済みの遷移を再削除しようとしても文書は変更しない", () => {
  const source = "state-machine 注文 =\n  state: 待機";
  const resolution = AnalyzedModel.create(source).stateMachines[0];

  expect(
    StateMachineSource.remove(source, resolution, {
      kind: "transition",
      range: SourceRange.onLine(3, 1, 10),
    }),
  ).toEqual(Result.err("遷移を特定できません"));
});

test("削除済みの状態の名前は編集しない", () => {
  const source = "state-machine 注文 =\n  state: 待機";
  const resolution = AnalyzedModel.create(source).stateMachines[0];

  expect(
    StateMachineSource.rename(source, resolution, {
      selection: StateMachineGraph.stateSelection("削除済み"),
      name: "保留",
    }),
  ).toEqual(Result.err("編集する名前を特定できません"));
});
