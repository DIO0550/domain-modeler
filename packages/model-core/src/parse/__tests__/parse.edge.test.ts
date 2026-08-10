import { expect, test } from "vitest";
import { Parse } from "..";

test("AND と OR の混在はエラー診断になる", () => {
  const result = Parse.parse("data 注文 = 注文ID AND 顧客情報 OR 状態");

  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "AND と OR を同じ宣言内で混在させることはできません",
    }),
  ]);
  expect(result.document.declarations[0]).toMatchObject({ kind: "error" });
});

test("範囲の下限が上限を超えるとエラー診断になる", () => {
  const result = Parse.parse("data 数量 = int constrained 100..1");

  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "範囲の下限が上限を超えています",
    }),
  ]);
  expect(result.document.declarations[0]).toMatchObject({ kind: "error" });
});

test("bool への制約はエラー診断になる", () => {
  const result = Parse.parse("data フラグ = bool constrained 0..1");

  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "bool 型に制約を付けることはできません",
    }),
  ]);
  expect(result.document.declarations[0]).toMatchObject({ kind: "error" });
});

test("date への制約はエラー診断になる", () => {
  const result = Parse.parse("data 日付 = date constrained 1..31");

  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "date 型に制約を付けることはできません",
    }),
  ]);
  expect(result.document.declarations[0]).toMatchObject({ kind: "error" });
});

test("datetime への制約はエラー診断になる", () => {
  const result = Parse.parse("data 時刻 = datetime constrained 1..100");

  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "datetime 型に制約を付けることはできません",
    }),
  ]);
  expect(result.document.declarations[0]).toMatchObject({ kind: "error" });
});

test("壊れた data 宣言の次の data 宣言は独立して解析される", () => {
  const source = `data 壊れた = int constrained 10..1
data 注文ID = string`;
  const result = Parse.parse(source);

  expect(result.diagnostics).toHaveLength(1);
  expect(result.document.declarations).toHaveLength(2);
  expect(result.document.declarations[0]).toMatchObject({ kind: "error" });
  expect(result.document.declarations[1]).toMatchObject({
    kind: "data",
    name: "注文ID",
  });
});

test("不正な入力でも例外を投げずに結果を返す", () => {
  expect(() => Parse.parse("data ====")).not.toThrow();
  const result = Parse.parse("data ====");
  expect(result.tokens.length).toBeGreaterThan(0);
  expect(result.diagnostics.length).toBeGreaterThan(0);
});
