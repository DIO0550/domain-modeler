import { expect, test } from "vitest";
import { Parse, Resolve, SourceRange, Tokenizer } from "..";
import { stateMachineDocument } from "./state-machine.test-support";

test("混在文書の状態、複数遷移、自己ループ、イベント、終端を公開APIから取得できる", () => {
  const tokens = Tokenizer.tokenize(stateMachineDocument);
  const parsed = Parse.parse(stateMachineDocument);
  const resolved = Resolve.resolve(parsed.document);

  expect(parsed.tokens).toEqual(tokens);
  expect(tokens.filter((token) => token.text === "->")).toHaveLength(3);
  expect(parsed.diagnostics).toEqual([]);
  expect(resolved.diagnostics).toEqual([]);
  expect(parsed.document.declarations.map((decl) => decl.kind)).toEqual([
    "data", "workflow", "state-machine", "state-machine",
  ]);
  expect(parsed.document.declarations[2]).toMatchObject({
    kind: "state-machine",
    name: "注文",
    range: { startLine: 5, endLine: 12 },
    states: [
      { name: "待機", initial: true, terminal: false },
      { name: "確認", initial: false, terminal: false },
      { name: "完了", initial: false, terminal: true },
    ],
    transitions: [
      { from: "待機", to: "完了", event: "確定" },
      { from: "待機", to: "待機", event: "再試行" },
      { from: "確認", to: "完了", event: "承認" },
    ],
  });
  expect(resolved.definitions["注文"]?.kind).toBe("state-machine");
  expect(resolved.stateMachines[0]?.references["待機"]).toEqual([
    SourceRange.onLine(6, 15, 17),
    SourceRange.onLine(7, 15, 17),
    SourceRange.onLine(7, 21, 23),
    SourceRange.onLine(9, 12, 14),
    SourceRange.onLine(10, 10, 12),
  ]);
  expect(resolved.stateMachines[1]?.definitions["申請"]?.nameRange).toEqual(
    SourceRange.onLine(15, 10, 12),
  );
  expect(resolved.references["申請"]).toBeUndefined();
});

test("未定義参照と重複名と初期状態の異常を範囲付きで報告する", () => {
  const parsed = Parse.parse(`data 注文 = string
state-machine 注文 =
  initial: 不明
  initial: 開始
  state: 開始
  state: 開始
  transition: 開始 -> 欠落 on 移動`);
  const resolved = Resolve.resolve(parsed.document);

  expect(parsed.diagnostics).toEqual([]);
  expect(resolved.definitions["注文"]?.kind).toBe("data");
  expect(resolved.diagnostics).toEqual([
    { severity: "error", message: "「注文」は既に宣言されています", range: SourceRange.onLine(2, 15, 17) },
    { severity: "error", message: "状態「開始」は既に宣言されています", range: SourceRange.onLine(6, 10, 12) },
    { severity: "error", message: "状態「不明」は未定義です", range: SourceRange.onLine(3, 12, 14) },
    { severity: "error", message: "初期状態は1つだけ指定できます", range: SourceRange.onLine(4, 3, 14) },
    { severity: "error", message: "状態「欠落」は未定義です", range: SourceRange.onLine(7, 21, 23) },
  ]);
});

test("壊れたマシンの後でも後続宣言を解析し参照を解決できる", () => {
  const parsed = Parse.parse(`state-machine 壊れた宣言
  state: 放置
data 注文ID = string
state-machine 回復 =
  initial: 待機
  state: 待機
  transition: 待機 ->
  transition: 待機 -> 完了 on 確定
  state: 完了 terminal
workflow 通知 =
  input: 注文ID
  output: 注文ID`);
  const resolved = Resolve.resolve(parsed.document);

  expect(parsed.document.declarations.map((decl) => decl.kind)).toEqual([
    "error", "data", "state-machine", "workflow",
  ]);
  expect(parsed.diagnostics).toEqual([
    { severity: "error", message: "= が必要です", range: SourceRange.onLine(1, 20, 20) },
    { severity: "error", message: "遷移先の識別子が必要です", range: SourceRange.onLine(7, 20, 20) },
  ]);
  expect(parsed.document.declarations[2]).toMatchObject({
    states: [{ name: "待機", initial: true }, { name: "完了", terminal: true }],
    transitions: [{ from: "待機", to: "完了", event: "確定" }],
  });
  expect(resolved.diagnostics).toEqual([]);
  expect(Object.keys(resolved.definitions)).toEqual(["注文ID", "回復", "通知"]);
  expect(resolved.references["注文ID"]).toHaveLength(3);
});
