import { expect } from "vitest";
import { ModelGraph, Parse, Resolve } from "../..";

/** 実際のDSL解析と全文参照解決を通したグラフ生成。 */
export const graphFromSource = (source: string, revision = 1): ModelGraph => {
  const parsed = Parse.parse(source);
  const resolution = Resolve.resolve(parsed.document);

  return ModelGraph.create({
    revision,
    document: parsed.document,
    resolution,
    diagnostics: [...parsed.diagnostics, ...resolution.diagnostics],
  });
};

/** IDの綴りに依存せず、各辺がつなぐ宣言名を検証する。 */
export const edgeNames = (
  graph: Pick<ModelGraph, "nodes" | "edges">,
): readonly (readonly string[])[] =>
  graph.edges.map((edge) => [
    graph.nodes.find((node) => node.id === edge.from)?.name ?? "",
    graph.nodes.find((node) => node.id === edge.to)?.name ?? "",
  ]);

/** テストの期待対象を名前と出現順で取得する。 */
export const expectNode = (
  graph: ModelGraph,
  name: string,
  occurrence = 0,
): ModelGraph["nodes"][number] => {
  const node = graph.nodes.filter((item) => item.name === name)[occurrence];

  expect(node).toBeDefined();

  return node;
};

/** CORE-01の受入用サンプル。 */
export const orderSource = `data 注文ID = string
data 顧客情報 = string
data 商品ID = string
data 数量 = int constrained 1..100
data 注文明細 = 商品ID AND 数量
data 注文 = 注文ID AND 顧客情報 AND 注文明細 list
data 注文確定 = 注文ID
data 検証エラー = string

workflow 注文を確定する =
  input: 注文
  output: 注文確定
  error: 検証エラー`;
