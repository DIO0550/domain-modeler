import { expect, test } from "vitest";
import { Parse } from "../..";

test("混在文書の複数マシンを行順と位置を保って解析する", () => {
  const result = Parse.parse(`data ID = string
state-machine 注文 = // 注文の状態
  transition: 待機 -> 完了 on 確定
  state: 完了 terminal
  initial: 待機
  state: 待機

workflow 処理 =
  input: ID
  output: ID
state-machine 返金 =
  initial: 申請
  state: 申請 terminal`);

  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations.map((decl) => decl.kind)).toEqual([
    "data",
    "state-machine",
    "workflow",
    "state-machine",
  ]);
  expect(result.document.declarations[1]).toMatchObject({
    name: "注文",
    range: { startLine: 2, endLine: 6 },
    initials: [
      {
        name: "待機",
        nameRange: { startLine: 5, startColumn: 12 },
        range: { startLine: 5 },
      },
    ],
    states: [
      {
        name: "完了",
        initial: false,
        terminal: true,
        nameRange: { startLine: 4 },
      },
      {
        name: "待機",
        initial: true,
        terminal: false,
        nameRange: { startLine: 6 },
      },
    ],
    transitions: [
      {
        from: "待機",
        to: "完了",
        event: "確定",
        fromRange: { startLine: 3 },
        toRange: { startLine: 3 },
        eventRange: { startLine: 3 },
      },
    ],
  });
  expect(result.document.declarations[3]).toMatchObject({
    name: "返金",
    states: [{ name: "申請", initial: true, terminal: true }],
  });
});

test("自己ループと同じ状態からの複数遷移を保持する", () => {
  const result = Parse.parse(`state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了
  transition: 待機 -> 待機 on 再試行
  transition: 待機 -> 完了 on 確定`);
  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations[0]).toMatchObject({
    transitions: [
      { from: "待機", to: "待機" },
      { from: "待機", to: "完了" },
    ],
  });
});

test("遷移矢印の前後に空白がなくても解析する", () => {
  const result = Parse.parse(`state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了
  transition: 待機->完了 on 確定`);
  expect(result.diagnostics).toEqual([]);
  expect(result.document.declarations[0]).toMatchObject({
    transitions: [{ from: "待機", to: "完了", event: "確定" }],
  });
});

test("重複する初期行の参照位置を両方保持する", () => {
  const result = Parse.parse(`state-machine 注文 =
  initial: 待機
  initial: 完了
  state: 待機
  state: 完了`);
  expect(result.document.declarations[0]).toMatchObject({
    initials: [
      { name: "待機", range: { startLine: 2 } },
      { name: "完了", range: { startLine: 3 } },
    ],
    states: [{ initial: true }, { initial: false }],
  });
});
