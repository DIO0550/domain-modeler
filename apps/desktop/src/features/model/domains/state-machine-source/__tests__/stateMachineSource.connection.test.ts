import { expect, test } from "vitest";
import { Result } from "@domain-modeler/canvas-core";
import { machine, position } from "./stateMachinePlacement.test-support";
import { StateMachineSource } from "..";

const source = "state-machine 注文 =\n  initial: 待機\n  state: 待機 // 説明\n  state: 完了 terminal\nstate-machine 返金 =\n  state: 待機";

test.each(["\n", "\r\n"])("接続作成は現在位置とコメントを保ち、同名状態を持つ別マシンを変更しない (%j)", (newline) => {
  const text = source.split("\n").join(newline);
  const result = Result.unwrap(StateMachineSource.connect(text, machine(text), { from: "待機", to: "完了", event: "確定" }));
  expect(position(result, "待機")).toEqual(position(text, "待機"));
  expect(position(result, "完了")).toEqual(position(text, "完了"));
  expect(result).toContain("// 説明 @canvas-position(v1,");
  expect(result).toContain(`  transition: 待機 -> 完了 on 確定${newline}state-machine 返金 =${newline}  state: 待機`);
  expect(result.split(newline).join("")).not.toContain("\n");
});

test.each([
  { from: "完了", to: "待機", event: "戻る" },
  { from: "待機", to: "不明", event: "確定" },
  { from: "待機", to: "完了", event: "" },
  { from: "待機", to: "完了", event: "空 白" },
])("不正な接続は座標も遷移も書き換えない: %j", (input) => {
  expect(StateMachineSource.connect(source, machine(source), input).ok).toBe(false);
});

test("同じ遷移の再追加は拒否する", () => {
  const input = { from: "待機", to: "完了", event: "確定" };
  const added = Result.unwrap(StateMachineSource.connect(source, machine(source), input));
  expect(StateMachineSource.connect(added, machine(added), input)).toEqual(Result.err("同じ遷移が既にあります"));
});

test("重複宣言や不正な座標を含むマシンでは接続による上書きを拒否する", () => {
  const duplicate = source.replace("  state: 待機 // 説明", "  state: 待機\n  state: 待機");
  const invalid = source.replace("// 説明", "// @canvas-position(v2, 1, 2)");
  const input = { from: "待機", to: "完了", event: "確定" };
  expect(StateMachineSource.connect(duplicate, machine(duplicate), input).ok).toBe(false);
  expect(StateMachineSource.connect(invalid, machine(invalid), input).ok).toBe(false);
});
