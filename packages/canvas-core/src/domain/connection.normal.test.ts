import { expect, test } from "vitest";
import { Connection } from "./connection";

test("始点と終点のテキストから note を A -> B 形式で派生する", () => {
  expect(Connection.buildNote("購入者", "注文が確定した")).toBe(
    "購入者 -> 注文が確定した",
  );
});

test("空の始点・終点テキストでも A -> B 形式を保つ", () => {
  expect(Connection.buildNote("", "")).toBe(" -> ");
});

test("ちょうど20文字のテキストは切り詰めない", () => {
  const twenty = "あいうえおかきくけこさしすせそたちつてと";
  expect(Connection.buildNote(twenty, "x")).toBe(`${twenty} -> x`);
});
