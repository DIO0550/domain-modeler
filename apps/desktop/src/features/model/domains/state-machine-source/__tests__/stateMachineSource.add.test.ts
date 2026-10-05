import { expect, test } from "vitest";
import { Result } from "@domain-modeler/model-core";
import { AnalyzedModel } from "../../analyzed-model";
import { StateMachineSource } from "..";

test.each([
  { initial: false, terminal: false, declarations: "  state: 受付" },
  {
    initial: true,
    terminal: false,
    declarations: "  initial: 受付\n  state: 受付",
  },
  { initial: false, terminal: true, declarations: "  state: 受付 terminal" },
  {
    initial: true,
    terminal: true,
    declarations: "  initial: 受付\n  state: 受付 terminal",
  },
])("状態を初期=$initial・終端=$terminalで追加できる", ({
  initial,
  terminal,
  declarations,
}) => {
  const source = "state-machine 注文 =";
  const resolution = AnalyzedModel.create(source).stateMachines[0]!;
  const result = StateMachineSource.add(source, resolution, {
    part: "state",
    name: "受付",
    initial,
    terminal,
  });

  expect(result).toEqual(Result.ok(`${source}\n${declarations}`));
});

test.each([
  "\n",
  "\r\n",
])("初期状態の置換ではコメントと他の宣言、改行を保持する (%j)", (newline) => {
  const source = [
    "data ID = string",
    "state-machine 注文 =",
    "  initial: 待機  // 初期状態の説明",
    "  state: 待機 // 状態の説明",
    "  transition: 待機 -> 待機 on 再試行 // 遷移の説明",
    "",
    "state-machine 返金 =",
    "  initial: 待機",
    "  state: 待機",
    "",
  ].join(newline);
  const resolution = AnalyzedModel.create(source).stateMachines[0]!;
  const result = StateMachineSource.add(source, resolution, {
    part: "state",
    name: "受付済み",
    initial: true,
    terminal: true,
  });
  const expected = source
    .replace("initial: 待機  //", "initial: 受付済み  //")
    .replace(
      `${newline}${newline}state-machine 返金`,
      `${newline}  state: 受付済み terminal${newline}${newline}state-machine 返金`,
    );

  expect(result).toEqual(Result.ok(expected));

  const updated = AnalyzedModel.create(expected).stateMachines[0]!;

  expect(updated.machine.initials.map((initial) => initial.name)).toEqual([
    "受付済み",
  ]);
  expect(
    updated.machine.states.map((state) => ({
      name: state.name,
      terminal: state.terminal,
    })),
  ).toEqual([
    { name: "待機", terminal: false },
    { name: "受付済み", terminal: true },
  ]);
});

test.each([
  "",
  "\r\n",
])("初期行のないCRLF文書へ初期・終端状態を追加して改行を保持する (末尾=%j)", (ending) => {
  const source = `state-machine 注文 =\r\n  state: 待機${ending}`;
  const resolution = AnalyzedModel.create(source).stateMachines[0]!;
  const result = StateMachineSource.add(source, resolution, {
    part: "state",
    name: "受付",
    initial: true,
    terminal: true,
  });

  expect(result).toEqual(
    Result.ok(
      `state-machine 注文 =\r\n  state: 待機\r\n  initial: 受付\r\n  state: 受付 terminal${ending}`,
    ),
  );
});

test("初期指定なしの状態追加は既存の初期状態を変えない", () => {
  const source = "state-machine 注文 =\n  initial: 待機 // 開始\n  state: 待機";
  const resolution = AnalyzedModel.create(source).stateMachines[0]!;
  const result = StateMachineSource.add(source, resolution, {
    part: "state",
    name: "受付",
    initial: false,
    terminal: false,
  });

  expect(result).toEqual(Result.ok(`${source}\n  state: 受付`));
});

test.each([
  { name: "待機", message: "同じ名前の状態が既にあります" },
  { name: "with space", message: "有効な状態名を入力してください" },
])("追加できない状態名 $name は初期状態の置換も確定しない", ({
  name,
  message,
}) => {
  const source = "state-machine 注文 =\n  initial: 待機 // 開始\n  state: 待機";
  const resolution = AnalyzedModel.create(source).stateMachines[0]!;

  expect(
    StateMachineSource.add(source, resolution, {
      part: "state",
      name,
      initial: true,
      terminal: true,
    }),
  ).toEqual(Result.err(message));
});

test("初期状態が重複している文書では初期状態として追加しない", () => {
  const source =
    "state-machine 注文 =\n  initial: 待機\n  initial: 完了\n  state: 待機\n  state: 完了 terminal";
  const resolution = AnalyzedModel.create(source).stateMachines[0]!;

  expect(
    StateMachineSource.add(source, resolution, {
      part: "state",
      name: "受付",
      initial: true,
      terminal: false,
    }),
  ).toEqual(Result.err("初期状態の重複をモデル定義で修正してください"));
});
