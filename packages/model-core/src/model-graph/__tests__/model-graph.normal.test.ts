import { expect, test } from "vitest";
import { ModelGraph, Parse, Resolve, SourceRange } from "../..";
import {
  edgeNames,
  expectNode,
  graphFromSource,
  orderSource,
} from "./model-graph.test-support";

test("CORE-01: 注文サンプルから9宣言と構文上の参照9辺を得る", () => {
  const graph = graphFromSource(orderSource, 27);

  expect(graph.revision).toBe(27);
  expect(graph.nodes.map((node) => node.name)).toEqual([
    "注文ID",
    "顧客情報",
    "商品ID",
    "数量",
    "注文明細",
    "注文",
    "注文確定",
    "検証エラー",
    "注文を確定する",
  ]);
  expect(graph.nodes.map((node) => node.kind)).toEqual([
    "data",
    "data",
    "data",
    "data",
    "data",
    "data",
    "data",
    "data",
    "workflow",
  ]);
  expect(edgeNames(graph)).toEqual([
    ["注文明細", "商品ID"],
    ["注文明細", "数量"],
    ["注文", "注文ID"],
    ["注文", "顧客情報"],
    ["注文", "注文明細"],
    ["注文確定", "注文ID"],
    ["注文を確定する", "注文"],
    ["注文を確定する", "注文確定"],
    ["注文を確定する", "検証エラー"],
  ]);
  expect(graph.diagnostics).toEqual([]);
});

test("CORE-01: 注文の直接近傍は5ノード4辺で2段先を含まない", () => {
  const graph = graphFromSource(orderSource);
  const selected = expectNode(graph, "注文");

  const neighborhood = ModelGraph.neighborhood(graph, selected.id);

  expect(neighborhood.nodes.map((node) => node.name)).toEqual([
    "注文ID",
    "顧客情報",
    "注文明細",
    "注文",
    "注文を確定する",
  ]);
  expect(edgeNames(neighborhood)).toEqual([
    ["注文", "注文ID"],
    ["注文", "顧客情報"],
    ["注文", "注文明細"],
    ["注文を確定する", "注文"],
  ]);
});

test("CORE-02: 同じ型のinputとoutputは1辺に両役割・修飾・位置を残す", () => {
  const graph = graphFromSource(`data 注文 = string
workflow 更新 =
  input: 注文 list option
  output: 注文 option list
  error: 注文`);
  const references = graph.edges[0].references;

  expect(edgeNames(graph)).toEqual([["更新", "注文"]]);
  expect(references.map((reference) => reference.role)).toEqual([
    "input",
    "output",
    "error",
  ]);
  expect(references.map((reference) => reference.term.modifiers)).toEqual([
    ["list", "option"],
    ["option", "list"],
    [],
  ]);
  expect(references.map((reference) => reference.nameRange)).toEqual([
    SourceRange.onLine(3, 10, 12),
    SourceRange.onLine(4, 11, 13),
    SourceRange.onLine(5, 10, 12),
  ]);
  expect(references.map((reference) => reference.term.range)).toEqual([
    SourceRange.onLine(3, 10, 24),
    SourceRange.onLine(4, 11, 25),
    SourceRange.onLine(5, 10, 12),
  ]);
  expect(new Set(references.map((reference) => reference.id)).size).toBe(3);
});

test("CORE-03: AND・OR・ALIAS・VALUEの構成と制約、プリミティブの項を保持する", () => {
  const graph = graphFromSource(`data ID = string
data 候補 = ID list option OR string option
data 集約 = ID AND 候補 list
data 別名 = 候補 option list
data 数量 = int constrained 1..100`);

  expect(graph.nodes).toMatchObject([
    {
      name: "ID",
      cardKind: "ALIAS",
      references: [
        {
          role: "alias",
          term: { name: "string" },
          resolution: { kind: "primitive" },
        },
      ],
    },
    {
      name: "候補",
      cardKind: "CHOICE",
      references: [
        { role: "choice", term: { name: "ID", modifiers: ["list", "option"] } },
        {
          role: "choice",
          term: { name: "string", modifiers: ["option"] },
          resolution: { kind: "primitive" },
        },
      ],
    },
    {
      name: "集約",
      cardKind: "RECORD",
      references: [{ role: "component" }, { role: "component" }],
    },
    {
      name: "別名",
      cardKind: "ALIAS",
      references: [{ role: "alias", term: { modifiers: ["option", "list"] } }],
    },
    {
      name: "数量",
      cardKind: "VALUE",
      references: [],
      declaration: {
        typeExpr: {
          primitive: "int",
          constraint: { bounds: { bound: "both", min: 1, max: 100 } },
        },
      },
    },
  ]);
  expect(edgeNames(graph)).toEqual([
    ["候補", "ID"],
    ["集約", "ID"],
    ["集約", "候補"],
    ["別名", "候補"],
  ]);
});

test("CORE-04: 後方の宣言とworkflowへの参照は既存の定義表で解決する", () => {
  const graph = graphFromSource(`data 手続き参照 = 処理
workflow 処理 =
  input: 後方
  output: 後方
data 後方 = string`);

  expect(edgeNames(graph)).toEqual([
    ["手続き参照", "処理"],
    ["処理", "後方"],
  ]);
  expect(graph.nodes.map((node) => node.kind)).toEqual([
    "data",
    "workflow",
    "data",
  ]);
  expect(
    graph.references.filter(
      (reference) => reference.resolution.kind === "unresolved",
    ),
  ).toEqual([]);
  expect(graph.diagnostics).toEqual([]);
});

test("同じ解析結果なら本文・AST・診断を変更せず同じ順序のグラフを得る", () => {
  const parsed = Parse.parse(orderSource);
  const resolution = Resolve.resolve(parsed.document);
  const analysis = Object.freeze({
    revision: 42,
    document: parsed.document,
    resolution,
    diagnostics: Object.freeze([
      ...parsed.diagnostics,
      ...resolution.diagnostics,
    ]),
  });
  const before = JSON.stringify({ source: orderSource, analysis });

  const first = ModelGraph.create(analysis);
  const second = ModelGraph.create(analysis);

  expect(first).toEqual(second);
  expect(JSON.stringify({ source: orderSource, analysis })).toBe(before);
  expect(first.nodes).toHaveLength(9);
});

test("孤立宣言とerror節がないworkflowも、プリミティブだけの項を保つ", () => {
  const graph = graphFromSource(`data 孤立 = string
workflow 操作 =
  input: int
  output: bool`);

  expect(graph.nodes).toMatchObject([
    { name: "孤立", kind: "data" },
    {
      name: "操作",
      kind: "workflow",
      declaration: { error: { present: false } },
      references: [
        {
          role: "input",
          term: { name: "int" },
          resolution: { kind: "primitive" },
        },
        {
          role: "output",
          term: { name: "bool" },
          resolution: { kind: "primitive" },
        },
      ],
    },
  ]);
  expect(graph.edges).toEqual([]);
});
