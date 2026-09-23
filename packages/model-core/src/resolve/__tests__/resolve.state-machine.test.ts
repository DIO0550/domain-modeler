import { expect, test } from "vitest";
import { Parse } from "../../parse";
import { SourceRange } from "../../source-range";
import { StateMachineDecl, TransitionDecl } from "../../state-machine-decl";
import { Resolve } from "..";

test("混在文書でマシン名を共有名前空間に登録し、状態参照をマシンごとに解決する", () => {
  const parsed = Parse.parse(`data ID = string
state-machine 注文 =
  transition: 待機 -> 完了 on 確定
  initial: 待機
  state: 待機
  state: 完了 terminal
workflow 通知 =
  input: ID
  output: ID
state-machine 返金 =
  initial: 待機
  state: 待機 terminal`);
  const resolved = Resolve.resolve(parsed.document);

  expect(parsed.diagnostics).toEqual([]);
  expect(resolved.diagnostics).toEqual([]);
  expect(Object.keys(resolved.definitions)).toEqual(["ID", "注文", "通知", "返金"]);
  expect(resolved.definitions["注文"]?.kind).toBe("state-machine");
  expect(resolved.references["待機"]).toBeUndefined();
  expect(resolved.references["注文"]).toEqual([SourceRange.onLine(2, 15, 17)]);
  expect(resolved.stateMachines).toHaveLength(2);
  const order = resolved.stateMachines[0];
  const refund = resolved.stateMachines[1];
  expect(order?.definitions["待機"]?.nameRange).toEqual(SourceRange.onLine(5, 10, 12));
  expect(order?.references["待機"]).toEqual([
    SourceRange.onLine(3, 15, 17),
    SourceRange.onLine(4, 12, 14),
    SourceRange.onLine(5, 10, 12),
  ]);
  expect(refund?.references["待機"]).toEqual([
    SourceRange.onLine(11, 12, 14),
    SourceRange.onLine(12, 10, 12),
  ]);
  expect(order?.references["確定"]).toBeUndefined();
});

test("data・workflow・machine の再宣言を出現順に検出し、最初の定義を保持する", () => {
  const parsed = Parse.parse(`data 注文 = string
state-machine 注文 =
  initial: 開始
  state: 開始
workflow 注文 =
  input: string
  output: string
state-machine 注文 =
  initial: 完了
  state: 完了`);
  const resolved = Resolve.resolve(parsed.document);

  expect(resolved.definitions["注文"]?.kind).toBe("data");
  expect(resolved.stateMachines).toHaveLength(2);
  expect(resolved.diagnostics).toEqual([
    { severity: "error", message: "「注文」は既に宣言されています", range: SourceRange.onLine(2, 15, 17) },
    { severity: "error", message: "「注文」は既に宣言されています", range: SourceRange.onLine(5, 10, 12) },
    { severity: "error", message: "「注文」は既に宣言されています", range: SourceRange.onLine(8, 15, 17) },
  ]);
});

test("欠落・重複・未定義を参照位置に診断し、壊れた行の後も状態を解決する", () => {
  const parsed = Parse.parse(`state-machine 空 =
state-machine 注文 =
  initial: 不明
  initial: 開始
  state: 開始
  state: 開始
  transition: 開始 ->
  transition: 開始 -> 欠落 on 移動
state-machine 次 =
  initial: 始点
  state: 始点`);
  const resolved = Resolve.resolve(parsed.document);

  expect(parsed.diagnostics).toMatchObject([
    { message: "遷移先の識別子が必要です", range: { startLine: 7 } },
  ]);
  expect(resolved.diagnostics).toEqual([
    { severity: "error", message: "状態が必要です", range: SourceRange.onLine(1, 15, 16) },
    { severity: "error", message: "初期状態が必要です", range: SourceRange.onLine(1, 15, 16) },
    { severity: "error", message: "状態「開始」は既に宣言されています", range: SourceRange.onLine(6, 10, 12) },
    { severity: "error", message: "状態「不明」は未定義です", range: SourceRange.onLine(3, 12, 14) },
    { severity: "error", message: "初期状態は1つだけ指定できます", range: SourceRange.onLine(4, 3, 14) },
    { severity: "error", message: "状態「欠落」は未定義です", range: SourceRange.onLine(8, 21, 23) },
  ]);
  expect(resolved.stateMachines[1]?.definitions["開始"]?.nameRange).toEqual(SourceRange.onLine(5, 10, 12));
  expect(resolved.stateMachines[1]?.references["欠落"]).toEqual([SourceRange.onLine(8, 21, 23)]);
  expect(resolved.stateMachines[2]?.diagnostics).toEqual([]);
});

test("終端からの遷移と完全一致する重複辺を検出し、自己ループと異なるイベントを許す", () => {
  const parsed = Parse.parse(`state-machine 状態 =
  initial: 開始
  state: 開始
  state: 終了 terminal
  transition: 開始 -> 開始 on 再試行
  transition: 開始 -> 終了 on 完了
  transition: 開始 -> 終了 on 再開
  transition: 開始 -> 終了 on 完了
  transition: 終了 -> 終了 on 再開`);
  const resolved = Resolve.resolve(parsed.document);

  expect(parsed.diagnostics).toEqual([]);
  expect(resolved.diagnostics).toEqual([
    { severity: "error", message: "同じ遷移が既に宣言されています", range: SourceRange.onLine(8, 3, 29) },
    { severity: "error", message: "終端状態「終了」からは遷移できません", range: SourceRange.onLine(9, 15, 17) },
  ]);
});

test("AST上の空イベント名も意味診断に残す", () => {
  const parsed = Parse.parse(`state-machine 注文 =
  initial: 開始
  state: 開始`);
  const machine = parsed.document.declarations[0];
  if (machine?.kind !== "state-machine") {
    throw new Error("テスト入力のマシンが解析されませんでした");
  }
  const transition = TransitionDecl.create({
    from: "開始",
    fromRange: SourceRange.onLine(4, 15, 17),
    to: "開始",
    toRange: SourceRange.onLine(4, 21, 23),
    event: "",
    eventRange: SourceRange.onLine(4, 27, 27),
    range: SourceRange.onLine(4, 3, 27),
  });
  const document = {
    ...parsed.document,
    declarations: [StateMachineDecl.create({ ...machine, transitions: [transition] })],
  };

  expect(Resolve.resolve(document).diagnostics).toEqual([
    { severity: "error", message: "イベント名が必要です", range: transition.eventRange },
  ]);
});

test("Object.prototype と同名の状態も参照表へ安全に登録する", () => {
  const parsed = Parse.parse(`state-machine Example =
  initial: toString
  state: toString
  state: constructor
  transition: toString -> constructor on go
  transition: constructor -> valueOf on next`);
  const resolved = Resolve.resolve(parsed.document);
  const machine = resolved.stateMachines[0];

  expect(parsed.diagnostics).toEqual([]);
  expect(Object.keys(machine?.references ?? {})).toEqual(["toString", "constructor", "valueOf"]);
  expect(machine?.references["toString"]).toHaveLength(3);
  expect(machine?.references["constructor"]).toHaveLength(3);
  expect(machine?.references["valueOf"]).toHaveLength(1);
  expect(resolved.diagnostics).toMatchObject([
    { severity: "error", message: "状態「valueOf」は未定義です" },
  ]);
});
