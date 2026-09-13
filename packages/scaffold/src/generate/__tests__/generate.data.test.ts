import { expect, test } from "vitest";
import { dmodel, sticky } from "./dmodel-fixture";

test("Domain Event の付箋は data スタブになる", () => {
  expect(dmodel([sticky("stk_event", "event", "注文が確定した")])).toContain(
    "data 注文が確定した = string // TODO 詳細化",
  );
});

test("Aggregate の付箋は data スタブになる", () => {
  expect(dmodel([sticky("stk_agg", "aggregate", "注文")])).toContain(
    "data 注文 = string // TODO 詳細化",
  );
});

test("Read Model の付箋は data スタブになる", () => {
  expect(dmodel([sticky("stk_rm", "readModel", "注文一覧")])).toContain(
    "data 注文一覧 = string // TODO 詳細化",
  );
});

test("Command の付箋は名前にコマンドを付けた data スタブになる", () => {
  expect(dmodel([sticky("stk_cmd", "command", "注文する")])).toContain(
    "data 注文するコマンド = string // TODO 詳細化",
  );
});

test("Hotspot の付箋は TODO コメントになる", () => {
  expect(dmodel([sticky("stk_hot", "hotspot", "在庫の扱いが未決")])).toContain(
    "// TODO(hotspot): 在庫の扱いが未決",
  );
});

test("付箋配列順で data と hotspot が出力され Actor と External System は未変換欄に残る", () => {
  const text = dmodel([
    sticky("stk_1", "actor", "顧客"),
    sticky("stk_2", "event", "注文が確定した"),
    sticky("stk_3", "hotspot", "在庫の扱いが未決"),
    sticky("stk_4", "command", "注文する"),
    sticky("stk_5", "aggregate", "注文"),
    sticky("stk_6", "readModel", "注文一覧"),
    sticky("stk_7", "externalSystem", "決済サービス"),
  ]);

  expect(text).toBe(`// 受注キャンバス から生成 (2026-09-13)
// このファイルは叩き台です。TODO と未定義の警告を埋めて育ててください

// ---- data ----

data 注文が確定した = string // TODO 詳細化
// TODO(hotspot): 在庫の扱いが未決
data 注文するコマンド = string // TODO 詳細化
data 注文 = string // TODO 詳細化
data 注文一覧 = string // TODO 詳細化

// ---- workflow ----

// ---- 未変換 ----

// actor: 顧客
// externalSystem: 決済サービス
`);
});
