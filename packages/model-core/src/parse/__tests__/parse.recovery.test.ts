import { expect, test } from "vitest";
import { Parse } from "..";

test("複数の不正宣言があっても正常なASTと診断を入力順で同時に返す", () => {
  const source = `data 注文ID = string
data 数量 = int constrained 10..1
workflow 壊れた =
  input: 注文 OR 在庫
  output: 確定イベント
data 顧客ID = string`;

  const result = Parse.parse(source);

  expect(result.document.declarations).toMatchObject([
    { kind: "data", name: "注文ID" },
    { kind: "error" },
    { kind: "error" },
    { kind: "data", name: "顧客ID" },
  ]);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "範囲の下限が上限を超えています",
    }),
    expect.objectContaining({
      severity: "error",
      message: "input: では OR を使用できません",
    }),
  ]);
});

test("入力末尾の不正宣言をErrorDeclと診断にして解析を終了する", () => {
  const source = `data 注文ID = string
data 数量 = int constrained 10..1`;

  const result = Parse.parse(source);

  expect(result.document.declarations).toMatchObject([
    { kind: "data", name: "注文ID" },
    { kind: "error" },
  ]);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "範囲の下限が上限を超えています",
    }),
  ]);
});

test("壊れた宣言の後の非同期行は ErrorDecl の範囲に含まれ次宣言は独立する", () => {
  const source = `data 数量 = int constrained 10..1
ゴミ行
data 注文ID = string`;

  const result = Parse.parse(source);

  expect(result.document.declarations).toMatchObject([
    {
      kind: "error",
      range: {
        startLine: 1,
        startColumn: 1,
        endLine: 2,
        endColumn: 4,
      },
    },
    { kind: "data", name: "注文ID" },
  ]);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "範囲の下限が上限を超えています",
    }),
  ]);
});

test("先頭の非同期トークンは ErrorDecl にして後続宣言の解析を継続する", () => {
  const source = `ゴミ行
data 注文ID = string`;

  const result = Parse.parse(source);

  expect(result.document.declarations).toMatchObject([
    {
      kind: "error",
      range: {
        startLine: 1,
        startColumn: 1,
        endLine: 1,
        endColumn: 4,
      },
    },
    { kind: "data", name: "注文ID" },
  ]);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "data または workflow で始まる宣言が必要です",
    }),
  ]);
});

test("同期ポイントの無い意味トークンだけの入力も ErrorDecl と診断を返す", () => {
  const result = Parse.parse("ゴミだけ");

  expect(result.document.declarations).toMatchObject([
    {
      kind: "error",
      range: {
        startLine: 1,
        startColumn: 1,
        endLine: 1,
        endColumn: 5,
      },
    },
  ]);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "data または workflow で始まる宣言が必要です",
    }),
  ]);
});
