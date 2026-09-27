import { expect, test } from "vitest";
import { Result } from "@domain-modeler/model-core";
import { AnalyzedModel } from "../../analyzed-model";
import { StateMachineSource } from "..";

const source = `data ID = string

state-machine 注文 =
  initial: 待機 // 初期
  state: 待機 // 説明
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定 // 矢印

state-machine 返金 =
  initial: 申請中
  state: 申請中`;

test("状態の名前変更は同じマシンの初期参照と遷移端点を一度に書き換える", () => {
  const resolution = AnalyzedModel.create(source).stateMachines[0]!;
  const result = StateMachineSource.updateState(source, resolution, { oldName: "待機", name: "保留", initial: true, terminal: false });
  expect(Result.isOk(result)).toBe(true);
  if (Result.isErr(result)) { return; }
  expect(result.value).toContain("initial: 保留 // 初期\n  state: 保留 // 説明");
  expect(result.value).toContain("transition: 保留 -> 完了 on 確定 // 矢印");
  expect(result.value).toContain("state-machine 返金 =\n  initial: 申請中");
  expect(AnalyzedModel.create(result.value).stateMachines[0]?.diagnostics).toEqual([]);
});

test("初期状態と終端属性の変更は既存のコメントを残す", () => {
  const resolution = AnalyzedModel.create(source).stateMachines[0]!;
  const result = StateMachineSource.updateState(source, resolution, { oldName: "完了", name: "完了", initial: true, terminal: true });
  expect(Result.isOk(result)).toBe(true);
  if (Result.isErr(result)) { return; }
  expect(result.value).toContain("initial: 完了 // 初期");
  expect(result.value).toContain("state: 完了 terminal");
  const next = StateMachineSource.updateState(result.value, AnalyzedModel.create(result.value).stateMachines[0]!, { oldName: "完了", name: "完了", initial: true, terminal: false });
  expect(Result.isOk(next)).toBe(true);
  if (Result.isErr(next)) { return; }
  expect(next.value).toContain("state: 完了\n");
});

test("遷移の属性変更は行末コメントを保持し、グラフを再構築できる", () => {
  const resolution = AnalyzedModel.create(source).stateMachines[0]!;
  const edge = resolution.machine.transitions[0]!;
  const result = StateMachineSource.updateTransition(source, resolution, { range: edge.range, from: "待機", to: "待機", event: "再試行" });
  expect(Result.isOk(result)).toBe(true);
  if (Result.isErr(result)) { return; }
  expect(result.value).toContain("transition: 待機 -> 待機 on 再試行 // 矢印");
  expect(AnalyzedModel.create(result.value).stateMachines[0]?.diagnostics).toEqual([]);
});

test("状態の削除はその初期参照と接続する遷移も同時に取り除く", () => {
  const resolution = AnalyzedModel.create(source).stateMachines[0]!;
  const result = StateMachineSource.remove(source, resolution, { kind: "state", name: "待機" });
  expect(Result.isOk(result)).toBe(true);
  if (Result.isErr(result)) { return; }
  expect(result.value).not.toContain("待機");
  expect(result.value).toContain("state: 完了 terminal\n\nstate-machine 返金");
});

test.each(["\n", "\r\n"])("改行なしの末尾で隣接する状態と遷移を削除できる (%s)", (newline) => {
  const value = ["state-machine 注文 =", "  initial: 待機", "  state: 待機", "  transition: 待機 -> 待機 on 再試行"].join(newline);
  const resolution = AnalyzedModel.create(value).stateMachines[0]!;
  const result = StateMachineSource.remove(value, resolution, { kind: "state", name: "待機" });
  expect(Result.isOk(result)).toBe(true);
  if (Result.isErr(result)) { return; }
  expect(result.value).toBe(`state-machine 注文 =${newline}`);
});

test("重複名や終端からの遷移は確定されず入力を保持できる", () => {
  const resolution = AnalyzedModel.create(source).stateMachines[0]!;
  expect(Result.isErr(StateMachineSource.updateState(source, resolution, { oldName: "待機", name: "完了", initial: true, terminal: false }))).toBe(true);
  expect(Result.isErr(StateMachineSource.updateState(source, resolution, { oldName: "待機", name: "待機", initial: true, terminal: true }))).toBe(true);
  expect(Result.isErr(StateMachineSource.updateTransition(source, resolution,
    { range: resolution.machine.transitions[0]!.range, from: "完了", to: "待機", event: "戻る" }))).toBe(true);
});

test("初期行がない状態に初期・終端を同時設定しても一行ずつ追加する", () => {
  const value = "state-machine 注文 =\n  state: 待機 // note";
  const result = StateMachineSource.updateState(value, AnalyzedModel.create(value).stateMachines[0]!,
    { oldName: "待機", name: "開始", initial: true, terminal: true });
  expect(Result.isOk(result)).toBe(true);
  if (Result.isErr(result)) { return; }
  expect(result.value).toBe("state-machine 注文 =\n  initial: 開始\n  state: 開始 terminal // note");
});

test("CRLFの文書では状態編集後も行末形式を維持する", () => {
  const value = "state-machine 注文 =\r\n  state: 待機\r\n  state: 完了 terminal\r\n";
  const result = StateMachineSource.updateState(value, AnalyzedModel.create(value).stateMachines[0]!,
    { oldName: "待機", name: "開始", initial: true, terminal: true });
  expect(Result.isOk(result)).toBe(true);
  if (Result.isErr(result)) { return; }
  expect(result.value).toBe("state-machine 注文 =\r\n  initial: 開始\r\n  state: 開始 terminal\r\n  state: 完了 terminal\r\n");
});
