import { expect, test } from "vitest";
import { Parse, Resolve, SourceRange } from "..";

test("複数dataとworkflowの代表文書からASTと未定義・重複の診断を同時に得られる", () => {
  const source = `// 注文ID はコメントでは参照として数えない
data 注文 = 注文ID AND 明細 list
data 注文ID = string
data 明細 = int constrained 1..100
workflow 注文する =
  input: 注文 AND 顧客
  output: 注文済み OR 保留
  error: 検証エラー
workflow 通知する =
  input: 注文済み
  output: string
data 注文済み = 注文ID
data 注文ID = int`;
  const parsed = Parse.parse(source);
  const resolved = Resolve.resolve(parsed.document);

  expect(parsed.diagnostics).toEqual([]);
  expect(parsed.document.declarations).toMatchObject([
    {
      kind: "data",
      name: "注文",
      typeExpr: {
        form: "record",
        terms: [
          { name: "注文ID", modifiers: [] },
          { name: "明細", modifiers: ["list"] },
        ],
      },
    },
    {
      kind: "data",
      name: "注文ID",
      typeExpr: { form: "alias", term: { name: "string", isPrimitive: true } },
    },
    {
      kind: "data",
      name: "明細",
      typeExpr: {
        form: "value",
        primitive: "int",
        constraint: { bounds: { bound: "both", min: 1, max: 100 } },
      },
    },
    {
      kind: "workflow",
      name: "注文する",
      input: { terms: [{ name: "注文" }, { name: "顧客" }] },
      output: { terms: [{ name: "注文済み" }, { name: "保留" }] },
      error: { present: true, terms: [{ name: "検証エラー" }] },
    },
    {
      kind: "workflow",
      name: "通知する",
      input: { terms: [{ name: "注文済み" }] },
      output: { terms: [{ name: "string" }] },
      error: { present: false },
    },
    { kind: "data", name: "注文済み" },
    { kind: "data", name: "注文ID" },
  ]);
  expect(resolved.diagnostics).toEqual(
    expect.arrayContaining([
      {
        severity: "warning",
        message: "「顧客」は未定義です",
        range: SourceRange.onLine(6, 17, 19),
      },
      {
        severity: "warning",
        message: "「保留」は未定義です",
        range: SourceRange.onLine(7, 19, 21),
      },
      {
        severity: "warning",
        message: "「検証エラー」は未定義です",
        range: SourceRange.onLine(8, 10, 15),
      },
      {
        severity: "error",
        message: "「注文ID」は既に宣言されています",
        range: SourceRange.onLine(13, 6, 10),
      },
    ]),
  );
  expect(resolved.diagnostics).toHaveLength(4);
  expect(resolved.definitions["注文ID"]).toMatchObject({
    kind: "data",
    range: { startLine: 3 },
  });
  expect(resolved.references["注文済み"]).toHaveLength(3);
  expect(
    resolved.references["注文ID"]?.every((range) => range.startLine !== 1),
  ).toBe(true);
});

test("壊れた宣言から回復した後も後続workflowの前方参照を解決できる", () => {
  const parsed = Parse.parse(`data 注文ID = string
data 数量 = int constrained 10..1
workflow 注文する =
  input: 注文ID
  output: 注文済み
data 注文済み = 注文ID`);
  const resolved = Resolve.resolve(parsed.document);

  expect(parsed.document.declarations).toMatchObject([
    { kind: "data", name: "注文ID" },
    { kind: "error" },
    { kind: "workflow", name: "注文する" },
    { kind: "data", name: "注文済み" },
  ]);
  expect(parsed.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: "範囲の下限が上限を超えています",
    }),
  ]);
  expect(resolved.diagnostics).toEqual([]);
  expect(Object.keys(resolved.definitions)).toEqual([
    "注文ID",
    "注文する",
    "注文済み",
  ]);
  expect(resolved.references["注文ID"]).toHaveLength(3);
});
