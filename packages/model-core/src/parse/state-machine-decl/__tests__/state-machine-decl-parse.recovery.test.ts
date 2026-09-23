import { expect, test } from "vitest";
import { Parse } from "../..";

test("壊れたヘッダーをエラー宣言にして後続の宣言を解析する", () => {
  const result = Parse.parse(`state-machine 注文
  state: 待機
data ID = string
state-machine 正常 =
  state: 完了`);
  expect(result.document.declarations).toMatchObject([
    { kind: "error", range: { startLine: 1, endLine: 2 } },
    { kind: "data", name: "ID" },
    { kind: "state-machine", name: "正常", states: [{ name: "完了" }] },
  ]);
  expect(result.diagnostics).toMatchObject([
    {
      message: "= が必要です",
      range: { startLine: 1, startColumn: 17, endColumn: 17 },
    },
  ]);
});

test("壊れた本文行を捨てて次の項目と次の宣言を解析する", () => {
  const result = Parse.parse(`state-machine 注文 =
  initial: 待機
  state: 待機
  transition: 待機 ->
  invalid: 名前
state: 不正
  transition: 待機 -> 待機 on 継続
  state: 完了 terminal
workflow 通知 =
  input: ID
  output: ID`);
  expect(result.document.declarations).toMatchObject([
    {
      kind: "state-machine",
      name: "注文",
      states: [{ name: "待機" }, { name: "完了" }],
      transitions: [{ event: "継続" }],
    },
    { kind: "workflow", name: "通知" },
  ]);
  expect(result.diagnostics).toMatchObject([
    {
      severity: "error",
      message: "遷移先の識別子が必要です",
      range: { startLine: 4, startColumn: 20, endColumn: 20 },
    },
    {
      severity: "error",
      message: "不明な state-machine の項目です",
      range: { startLine: 5 },
    },
    {
      severity: "error",
      message: "本文の項目にはインデントが必要です",
      range: { startLine: 6 },
    },
  ]);
});

test("予約語やプリミティブの名前と余分なトークンを診断し正常行を残す", () => {
  const result = Parse.parse(`state-machine 注文 =
  initial: int
  state: terminal
  state: 待機 terminal 余剰
  transition: 待機 -> 完了 on data
  state: 待機`);
  expect(result.document.declarations[0]).toMatchObject({
    kind: "state-machine",
    initials: [],
    states: [{ name: "待機" }],
    transitions: [],
  });
  expect(
    result.diagnostics.map((diagnostic) => diagnostic.range.startLine),
  ).toEqual([2, 3, 4, 5]);
});

test("改行をまたいで欠けた遷移先を補わず行末に診断を付ける", () => {
  const result = Parse.parse(`state-machine 注文 =
  transition: 開始 ->
  state: 完了
  initial: 完了`);
  expect(result.document.declarations[0]).toMatchObject({
    kind: "state-machine",
    transitions: [],
    states: [{ name: "完了", initial: true }],
  });
  expect(result.diagnostics).toMatchObject([
    { range: { startLine: 2, endLine: 2, startColumn: 20, endColumn: 20 } },
  ]);
});

test("不完全なヘッダーの名前と余剰を該当行の範囲で診断する", () => {
  const missing = Parse.parse("state-machine\ndata ID = string");
  const extra = Parse.parse("state-machine 注文 = 余剰\ndata ID = string");
  expect(missing.document.declarations.map((decl) => decl.kind)).toEqual([
    "error",
    "data",
  ]);
  expect(missing.diagnostics[0]).toMatchObject({
    range: { startLine: 1, endLine: 1 },
  });
  expect(extra.document.declarations.map((decl) => decl.kind)).toEqual([
    "error",
    "data",
  ]);
  expect(extra.diagnostics[0]).toMatchObject({
    range: { startLine: 1, startColumn: 20 },
  });
});
