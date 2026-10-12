import { expect, test } from "vitest";
import { DependencyCard } from "..";
import { nodeFromSource } from "./dependencyCard.test-support";

test.each([
  {
    source: "data 対象 = string",
    kind: "ALIAS",
    rows: [{ label: "別名", text: "string" }],
  },
  {
    source: "data 対象 = A list option AND B option list",
    kind: "RECORD",
    rows: [
      { label: "AND", text: "A list option" },
      { label: "AND", text: "B option list" },
    ],
  },
  {
    source: "data 対象 = string OR A option",
    kind: "CHOICE",
    rows: [
      { label: "OR", text: "string" },
      { label: "OR", text: "A option" },
    ],
  },
  {
    source: "data 対象 = int constrained 1..100",
    kind: "VALUE",
    rows: [
      { label: "型", text: "int" },
      { label: "範囲", text: "1..100" },
    ],
  },
  {
    source: "data 対象 = decimal constrained ..95",
    kind: "VALUE",
    rows: [
      { label: "型", text: "decimal" },
      { label: "範囲", text: "..95" },
    ],
  },
  {
    source: "data 対象 = string constrained length 1..",
    kind: "VALUE",
    rows: [
      { label: "型", text: "string" },
      { label: "長さ", text: "1.." },
    ],
  },
])("宣言の構造と修飾・制約をカードへ保持する: $source", ({
  source,
  kind,
  rows,
}) => {
  const node = nodeFromSource({ source, name: "対象" });

  const card = DependencyCard.create(node);

  expect(card).toEqual({ id: node.id, name: "対象", kind, rows });
});

test("workflowの入力をAND、出力とエラーをORで表示する", () => {
  const node = nodeFromSource({
    name: "処理",
    source:
      "workflow 処理 =\n  input: A list option AND B\n  output: C OR D option\n  error: E OR F list\n",
  });

  const card = DependencyCard.create(node);

  expect(card.kind).toBe("WORKFLOW");
  expect(card.rows).toEqual([
    { label: "入力", text: "A list option AND B" },
    { label: "出力", text: "C OR D option" },
    { label: "エラー", text: "E OR F list" },
  ]);
});

test("エラー未指定のworkflowに架空のエラー行を追加しない", () => {
  const node = nodeFromSource({
    name: "処理",
    source: "workflow 処理 =\n  input: string\n  output: int\n",
  });

  expect(DependencyCard.create(node).rows).toEqual([
    { label: "入力", text: "string" },
    { label: "出力", text: "int" },
  ]);
});

test("同名宣言を行番号付きの名前で区別する", () => {
  const source = "data 注文 = string\ndata 注文 = int\n";
  const first = nodeFromSource({ source, name: "注文" });
  const second = nodeFromSource({ source, name: "注文", occurrence: 1 });

  expect(DependencyCard.create(first).name).toBe("注文 (行 1)");
  expect(DependencyCard.create(second).name).toBe("注文 (行 2)");
});

test.each([
  ["component", "構成要素"],
  ["choice", "選択肢"],
  ["alias", "別名"],
  ["input", "入力"],
  ["output", "出力"],
  ["error", "エラー"],
] as const)("参照役割%sを%sとして表示する", (role, label) => {
  expect(DependencyCard.roleLabel(role)).toBe(label);
});
