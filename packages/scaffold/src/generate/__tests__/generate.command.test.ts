import {
  ConnectionId,
  StickyId,
  type Connection,
} from "@domain-modeler/canvas-core";
import { Parse, Resolve } from "@domain-modeler/model-core";
import { expect, test } from "vitest";
import { dmodel, sticky } from "./dmodel-fixture";

/** 接続順を明示するテスト用の接続。 */
const connection = (from: string, to: string, label = ""): Connection => ({
  id: ConnectionId.create(`${from}-${to}-${label}`),
  from: StickyId.create(from),
  to: StickyId.create(to),
  label,
  note: "",
});

test("Command は input data と workflow を生成し Event が無ければ未定義 TODO を残す", () => {
  const text = dmodel([sticky("c", "command", "注文する")]);
  expect(text).toContain("data 注文するコマンド = string // TODO 詳細化");
  expect(text).toContain(
    "workflow 注文する =\n  input: 注文するコマンド\n  output: TODO結果イベント",
  );
  expect(text).not.toContain("error:");
  const parsed = Parse.parse(text);
  expect(parsed.diagnostics).toEqual([]);
  expect(
    Resolve.resolve(parsed.document).diagnostics.map(
      (diagnostic) => diagnostic.message,
    ),
  ).toEqual(["「TODO結果イベント」は未定義です"]);
});

test("ラベルの無い出力 Event は接続配列順に1行の OR で結合される", () => {
  const text = dmodel(
    [
      sticky("c", "command", "注文する"),
      sticky("e1", "event", "確定した"),
      sticky("e2", "event", "保留した"),
    ],
    [connection("c", "e2"), connection("c", "e1")],
  );
  expect(text).toContain("  output: 保留した OR 確定した");
  const parsed = Parse.parse(text);
  expect(parsed.diagnostics).toEqual([]);
  expect(Resolve.resolve(parsed.document).diagnostics).toEqual([]);
});

test("ラベル付き出力が1本でもあればラベル無しの項も継続行になる", () => {
  const text = dmodel(
    [
      sticky("c", "command", "注文する"),
      sticky("e1", "event", "確定した"),
      sticky("e2", "event", "保留した"),
      sticky("e3", "event", "失敗した"),
    ],
    [
      connection("c", "e1"),
      connection("c", "e2", "在庫不足"),
      connection("c", "e3"),
    ],
  );
  expect(text).toContain(
    "  output: 確定した\n    OR 保留した // 在庫不足\n    OR 失敗した",
  );
  expect(Parse.parse(text).diagnostics).toEqual([]);
});

test("Event が1件でもラベルはその項の行末に残る", () => {
  const text = dmodel(
    [sticky("c", "command", "注文する"), sticky("e", "event", "確定した")],
    [connection("c", "e", "成功")],
  );
  expect(text).toContain("  output: 確定した // 成功");
});

test("非 Event 接続はラベルとともに workflow 直前のコメントに残る", () => {
  const text = dmodel(
    [
      sticky("c", "command", "注文する"),
      sticky("x", "externalSystem", "決済サービス"),
      sticky("a", "aggregate", "注文"),
      sticky("next", "command", "通知する"),
    ],
    [
      connection("c", "x", "カード決済"),
      connection("c", "a"),
      connection("c", "next"),
    ],
  );
  expect(text).toContain(
    "// -> 決済サービス\n// カード決済\n// -> 注文\n// -> 通知する\nworkflow 注文する =\n  input: 注文するコマンド\n  output: TODO結果イベント",
  );
});

test("Command に入る Event 接続や他の Command の接続は output に含まれない", () => {
  const text = dmodel(
    [
      sticky("c", "command", "注文する"),
      sticky("e", "event", "確定した"),
      sticky("other", "command", "通知する"),
    ],
    [connection("e", "c"), connection("other", "e")],
  );
  expect(text).toContain(
    "workflow 注文する =\n  input: 注文するコマンド\n  output: TODO結果イベント",
  );
  expect(text).toContain(
    "workflow 通知する =\n  input: 通知するコマンド\n  output: 確定した",
  );
});

test("同じ識別子の Command は接続をまとめて1つの workflow になる", () => {
  const text = dmodel(
    [
      sticky("c1", "command", "注文 する"),
      sticky("c2", "command", "注文\nする"),
      sticky("e1", "event", "確定した"),
      sticky("e2", "event", "保留した"),
    ],
    [connection("c1", "e1"), connection("c2", "e2"), connection("c2", "e1")],
  );
  expect(text.match(/^workflow /gmu)).toHaveLength(1);
  expect(text).toContain("workflow 注文_する =");
  expect(text).toContain("  output: 確定した OR 保留した");
});

test("予約語と改行を含む識別子は data と workflow の参照が一致する", () => {
  const text = dmodel(
    [sticky("c", "command", "data"), sticky("e", "event", "注文\n確定")],
    [connection("c", "e")],
  );
  expect(text).toContain(
    "workflow data_ =\n  input: data_コマンド\n  output: 注文_確定",
  );
  const parsed = Parse.parse(text);
  expect(parsed.diagnostics).toEqual([]);
  expect(Resolve.resolve(parsed.document).diagnostics).toEqual([]);
});

test("ラベルと非 Event 本文の改行は DSL の宣言として解釈されない", () => {
  const text = dmodel(
    [
      sticky("c", "command", "注文する"),
      sticky("e", "event", "確定した"),
      sticky("x", "externalSystem", "外部\r\nworkflow 偽 ="),
    ],
    [
      connection("c", "e", "成功\r\n継続\rdata 偽 = string"),
      connection("c", "x", "外部呼出\n続き"),
    ],
  );
  expect(text).toContain(
    "  output: 確定した // 成功\n    // 継続\n    // data 偽 = string",
  );
  expect(text).toContain(
    "// -> 外部\n// workflow 偽 =\n// 外部呼出\n// 続き\nworkflow 注文する",
  );
  expect(Parse.parse(text).diagnostics).toEqual([]);
});

test("識別子化できない Command は input も workflow も生成しない", () => {
  const text = dmodel([
    sticky("c1", "command", ""),
    sticky("c2", "command", "1st"),
  ]);
  expect(text).not.toMatch(/^workflow /mu);
  expect(text).not.toMatch(/^data /mu);
  expect(text).toContain("// command: 1st");
});

test("変換できない Event への接続はコメントに残り TODO 出力になる", () => {
  const text = dmodel(
    [sticky("c", "command", "注文する"), sticky("e", "event", "1st")],
    [connection("c", "e", "未決")],
  );
  expect(text).toContain("// -> 1st\n// 未決\nworkflow 注文する");
  expect(text).toContain("  output: TODO結果イベント");
  expect(Parse.parse(text).diagnostics).toEqual([]);
});

test("同じ Event への異なるラベルは両方とも残る", () => {
  const text = dmodel(
    [sticky("c", "command", "注文する"), sticky("e", "event", "確定した")],
    [connection("c", "e", "通常"), connection("c", "e", "再試行")],
  );
  expect(text).toContain(
    "  output: 確定した // 通常\n    OR 確定した // 再試行",
  );
});

test("先出 data と workflow 名が衝突する Command は未変換になる", () => {
  const text = dmodel([
    sticky("e", "event", "注文"),
    sticky("c", "command", "注文"),
  ]);
  expect(text).not.toMatch(/^workflow /mu);
  expect(text).not.toContain("data 注文コマンド");
  expect(text).toContain("// command: 注文");
});

test("先出 workflow と名前が衝突する data は未変換になる", () => {
  const text = dmodel([
    sticky("c", "command", "注文"),
    sticky("e", "event", "注文"),
  ]);
  expect(text).toContain("workflow 注文 =");
  expect(text).not.toContain("data 注文 =");
  expect(text).toContain("// event: 注文");
});

test("input data 名が衝突した Command の workflow も生成しない", () => {
  const text = dmodel([
    sticky("e", "event", "注文コマンド"),
    sticky("c", "command", "注文"),
  ]);
  expect(text).not.toMatch(/^workflow /mu);
  expect(text).toContain("// command: 注文");
});
