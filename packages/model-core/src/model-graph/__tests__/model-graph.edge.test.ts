import { expect, test } from "vitest";
import { ModelGraph, Parse, Resolve, SourceRange } from "../..";
import {
  edgeNames,
  expectNode,
  graphFromSource,
} from "./model-graph.test-support";

test("CORE-05: 未定義名は1ノードに集まり、重複参照の修飾と警告を全て残す", () => {
  const graph = graphFromSource(`data A = 未定義 list AND 未定義 option
data B = 未定義`);
  const unresolved = expectNode(graph, "未定義");

  expect(graph.nodes.map((node) => node.name)).toEqual(["A", "未定義", "B"]);
  expect(unresolved).toMatchObject({
    kind: "unresolved",
    occurrences: [
      SourceRange.onLine(1, 10, 13),
      SourceRange.onLine(1, 23, 26),
      SourceRange.onLine(2, 10, 13),
    ],
  });
  expect(unresolved.diagnostics).toHaveLength(3);
  expect(edgeNames(graph)).toEqual([
    ["A", "未定義"],
    ["B", "未定義"],
  ]);
  expect(
    graph.edges[0].references.map((reference) => reference.term.modifiers),
  ).toEqual([["list"], ["option"]]);
  expect(
    graph.edges
      .flatMap((edge) => edge.references)
      .map((reference) => reference.diagnostics.length),
  ).toEqual([1, 1, 1]);
});

test("未定義名の追加・解消・再削除で、補助ノードと辺が現在の解析結果へ置き換わる", () => {
  const undefinedGraph = graphFromSource("data A = 対象", 1);
  const definedGraph = graphFromSource("data A = 対象\ndata 対象 = string", 2);
  const deletedGraph = graphFromSource("data A = 対象", 3);

  expect(expectNode(undefinedGraph, "対象").kind).toBe("unresolved");
  expect(expectNode(definedGraph, "対象").kind).toBe("data");
  expect(
    definedGraph.nodes.filter((node) => node.kind === "unresolved"),
  ).toEqual([]);
  expect(expectNode(deletedGraph, "対象").kind).toBe("unresolved");
  expect(definedGraph.edges[0].to).toBe(expectNode(definedGraph, "対象").id);
  expect(deletedGraph.edges[0].to).toBe(expectNode(deletedGraph, "対象").id);
  expect(definedGraph.edges[0].to).not.toBe(undefinedGraph.edges[0].to);
  expect(deletedGraph.revision).toBe(3);
});

test("CORE-06: 多段循環と自己参照の全辺を保持し、近傍は1段で止まる", () => {
  const graph = graphFromSource(`data A = B
data B = C
data C = A
data 自己 = 自己`);
  const neighborhood = ModelGraph.neighborhood(
    graph,
    expectNode(graph, "A").id,
  );
  const selfNeighborhood = ModelGraph.neighborhood(
    graph,
    expectNode(graph, "自己").id,
  );

  expect(edgeNames(graph)).toEqual([
    ["A", "B"],
    ["B", "C"],
    ["C", "A"],
    ["自己", "自己"],
  ]);
  expect(edgeNames(neighborhood)).toEqual([
    ["A", "B"],
    ["C", "A"],
  ]);
  expect(selfNeighborhood.nodes).toHaveLength(1);
  expect(selfNeighborhood.edges).toHaveLength(1);
  expect(graph.diagnostics).toEqual([]);
});

test("CORE-07: 同名宣言は一意なノードとなり、先頭への参照と後続の重複診断を保つ", () => {
  const graph = graphFromSource(`data 名前 = string
data 名前 = int
data 参照 = 名前`);
  const first = expectNode(graph, "名前");
  const second = expectNode(graph, "名前", 1);

  expect(first.id).not.toBe(second.id);
  expect(first.label).toBe("名前 (行 1)");
  expect(second.label).toBe("名前 (行 2)");
  expect(first.diagnostics).toEqual([]);
  expect(second.diagnostics).toEqual([
    {
      severity: "error",
      message: "「名前」は既に宣言されています",
      range: SourceRange.onLine(2, 6, 8),
    },
  ]);
  expect(graph.edges).toMatchObject([
    { from: expectNode(graph, "参照").id, to: first.id },
  ]);
});

test("CORE-08: dataと同名のstate-machineイベントから型参照の辺を作らない", () => {
  const graph = graphFromSource(`data 実行 = string
state-machine 状態 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 実行`);

  expect(graph.nodes.map((node) => node.name)).toEqual(["実行"]);
  expect(graph.references).toMatchObject([{ term: { name: "string" } }]);
  expect(graph.edges).toEqual([]);
  expect(graph.diagnostics).toEqual([]);
});

test("CORE-09: 対象外宣言に解決された参照は未定義にせず定義位置を保持する", () => {
  const graph = graphFromSource(`data 参照 = 状態 list option
state-machine 状態 =
  initial: 待機
  state: 待機`);
  const reference = graph.references[0];

  expect(graph.nodes.map((node) => node.name)).toEqual(["参照"]);
  expect(reference).toMatchObject({
    term: { modifiers: ["list", "option"] },
    nameRange: SourceRange.onLine(1, 11, 13),
    resolution: {
      kind: "outside",
      definition: {
        kind: "state-machine",
        name: "状態",
        nameRange: SourceRange.onLine(2, 15, 17),
      },
    },
    diagnostics: [],
  });
  expect(graph.edges).toEqual([]);
  expect(graph.diagnostics).toEqual([]);
  expect(ModelGraph.neighborhood(graph, graph.nodes[0].id).nodes).toHaveLength(
    1,
  );
});

test("表示対象外が先頭の同名宣言でも後続のdataへ勝手に解決し直さない", () => {
  const graph = graphFromSource(`state-machine 共通 =
  initial: 待機
  state: 待機
data 共通 = string
data 参照 = 共通`);

  expect(expectNode(graph, "共通")).toMatchObject({
    label: "共通 (行 4)",
    diagnostics: [{ severity: "error" }],
  });
  expect(
    graph.references.find((reference) => reference.term.name === "共通")
      ?.resolution.kind,
  ).toBe("outside");
  expect(graph.edges).toEqual([]);
});

test("CORE-10: 破損宣言の構文診断を残し、後続の正常な宣言と辺を生成する", () => {
  const source = `data 壊れた = int constrained 10..1
data 参照 = 後方
data 後方 = string`;
  const parsed = Parse.parse(source);
  const graph = graphFromSource(source);

  expect(parsed.diagnostics).toHaveLength(1);
  expect(graph.nodes.map((node) => node.name)).toEqual(["参照", "後方"]);
  expect(edgeNames(graph)).toEqual([["参照", "後方"]]);
  expect(graph.diagnostics).toEqual(parsed.diagnostics);
});

test("対象外マシンの診断もグラフ全体に残り、dataノードに誤って所属しない", () => {
  const source = `data 型 = string
state-machine 状態 =
  state: 待機
  transition: 待機 -> 不明 on 実行`;
  const parsed = Parse.parse(source);
  const resolution = Resolve.resolve(parsed.document);
  const graph = graphFromSource(source);

  expect(resolution.diagnostics.length).toBeGreaterThan(0);
  expect(graph.diagnostics).toEqual(resolution.diagnostics);
  expect(graph.nodes[0].diagnostics).toEqual([]);
});

test("未定義ノードの直接近傍はその参照元を全て含む", () => {
  const graph = graphFromSource(`data A = 不明
data B = 不明
data C = A`);

  const neighborhood = ModelGraph.neighborhood(
    graph,
    expectNode(graph, "不明").id,
  );

  expect(neighborhood.nodes.map((node) => node.name)).toEqual([
    "A",
    "不明",
    "B",
  ]);
  expect(edgeNames(neighborhood)).toEqual([
    ["A", "不明"],
    ["B", "不明"],
  ]);
});

test("空文書や失われた選択IDの直接近傍は空集合になる", () => {
  const empty = graphFromSource("");
  const graph = graphFromSource("data 孤立 = string");

  expect(empty.nodes).toEqual([]);
  expect(empty.edges).toEqual([]);
  expect(ModelGraph.neighborhood(graph, "missing")).toEqual({
    nodes: [],
    edges: [],
  });
  expect(ModelGraph.neighborhood(graph, graph.nodes[0].id)).toEqual({
    nodes: graph.nodes,
    edges: [],
  });
});

test("改行コードと日本語名が含まれても宣言順・修飾位置と診断を保持する", () => {
  const source =
    "data 前 = 後 list option\r\ndata 後 = string\r\ndata 未解決 = 不明 option\r\n";
  const parsed = Parse.parse(source);
  const resolution = Resolve.resolve(parsed.document);
  const graph = graphFromSource(source);

  expect(graph.references[0].term.range).toEqual(SourceRange.onLine(1, 10, 23));
  expect(graph.references[0].nameRange).toEqual(SourceRange.onLine(1, 10, 11));
  expect(graph.edges[1].references[0].diagnostics).toEqual(
    resolution.diagnostics,
  );
  expect(graph.nodes.map((node) => node.name)).toEqual([
    "前",
    "後",
    "未解決",
    "不明",
  ]);
});
