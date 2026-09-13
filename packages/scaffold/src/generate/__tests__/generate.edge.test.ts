import { expect, test } from "vitest";
import { dmodel, sticky } from "./dmodel-fixture";

test("同一テキストの Event は1つの data スタブに統合される", () => {
  const text = dmodel([
    sticky("stk_1", "event", "注文が確定した"),
    sticky("stk_2", "event", "注文が確定した"),
  ]);

  expect(
    text.match(/data 注文が確定した = string \/\/ TODO 詳細化/gu),
  ).toHaveLength(1);
});

test("空白の違いだけがある Event は正規化後の識別子で統合される", () => {
  const text = dmodel([
    sticky("stk_1", "event", "注文 確定"),
    sticky("stk_2", "event", "注文\n確定"),
  ]);

  expect(text).toContain("data 注文_確定 = string // TODO 詳細化");
  expect(text.match(/^data /gmu)).toHaveLength(1);
});

test("空文字の付箋は未変換欄に残る", () => {
  const text = dmodel([
    sticky("stk_event", "event", ""),
    sticky("stk_hot", "hotspot", ""),
  ]);

  expect(text).toContain("// event: ");
  expect(text).toContain("// hotspot: ");
  expect(text.match(/^data /gmu)).toBeNull();
  expect(text).not.toContain("TODO(hotspot)");
});

test("識別子にできない Event は未変換欄に残る", () => {
  const text = dmodel([sticky("stk_event", "event", "1st")]);

  expect(text).toContain("// event: 1st");
  expect(text).not.toContain("data 1st");
});

test("予約語の Event は suffix 付きの data スタブになる", () => {
  expect(dmodel([sticky("stk_event", "event", "data")])).toContain(
    "data data_ = string // TODO 詳細化",
  );
});

test("予約語の Command は識別子化してからコマンド接尾辞を付ける", () => {
  expect(dmodel([sticky("stk_cmd", "command", "data")])).toContain(
    "data data_コマンド = string // TODO 詳細化",
  );
});

test("同じ本文の Event と Command は別識別子の data スタブになる", () => {
  const text = dmodel([
    sticky("stk_event", "event", "注文する"),
    sticky("stk_cmd", "command", "注文する"),
  ]);

  expect(text).toContain("data 注文する = string // TODO 詳細化");
  expect(text).toContain("data 注文するコマンド = string // TODO 詳細化");
});

test("Command 接尾辞が先出 Event の識別子と衝突する後着は未変換欄に残る", () => {
  const text = dmodel([
    sticky("stk_event", "event", "注文コマンド"),
    sticky("stk_cmd", "command", "注文"),
  ]);

  expect(text).toContain("data 注文コマンド = string // TODO 詳細化");
  expect(text).toContain("// command: 注文");
  expect(text.match(/^data /gmu)).toHaveLength(1);
});

test("先に出た Command と識別子が衝突する Event は未変換欄に残る", () => {
  const text = dmodel([
    sticky("stk_cmd", "command", "注文"),
    sticky("stk_event", "event", "注文コマンド"),
  ]);

  expect(text).toContain("data 注文コマンド = string // TODO 詳細化");
  expect(text).toContain("// event: 注文コマンド");
  expect(text.match(/^data /gmu)).toHaveLength(1);
});

test("改行を含む Hotspot は各物理行をコメントにする", () => {
  const text = dmodel([sticky("stk_hot", "hotspot", "在庫\n期限")]);

  expect(text).toContain("// TODO(hotspot): 在庫\n// 期限");
  expect(text.split("\n").includes("期限")).toBe(false);
});

test("改行を含む未変換付箋は各物理行をコメントにする", () => {
  const text = dmodel([sticky("stk_actor", "actor", "顧客\n法人")]);

  expect(text).toContain("// actor: 顧客\n// 法人");
  expect(text.split("\n").includes("法人")).toBe(false);
});

test("付箋が無いキャンバスでも見出しだけ出力する", () => {
  expect(dmodel([])).toBe(`// 受注キャンバス から生成 (2026-09-13)
// このファイルは叩き台です。TODO と未定義の警告を埋めて育ててください

// ---- data ----

// ---- workflow ----

// ---- 未変換 ----
`);
});
