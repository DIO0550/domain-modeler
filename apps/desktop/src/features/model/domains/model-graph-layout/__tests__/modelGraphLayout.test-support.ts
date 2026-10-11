import { ModelGraph, Parse, Resolve } from "@domain-modeler/model-core";
import { expect } from "vitest";
import { ModelGraphLayout } from "..";

/** 実際のDSL解析結果と、カードごとに異なる計測寸法を準備する。 */
export const setup = (source: string) => {
  const parsed = Parse.parse(source);
  const resolution = Resolve.resolve(parsed.document);
  const graph = ModelGraph.create({
    revision: 7,
    document: parsed.document,
    resolution,
    diagnostics: [...parsed.diagnostics, ...resolution.diagnostics],
  });
  const sizes = new Map(
    graph.nodes.map((node, index) => [
      node.id,
      {
        width: 200 + node.name.length * 16 + index * 31,
        height: 80 + node.references.length * 32 + index * 43,
      },
    ]),
  );

  return { graph, sizes };
};

/** 失敗時にテストを止め、配置結果を取り出す。 */
export const expectLayout = ({
  graph,
  sizes,
}: ReturnType<typeof setup>): ModelGraphLayout => {
  const result = ModelGraphLayout.create(graph, sizes);

  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.value;
};

/** 全カードと経路点が有限の描画領域内に収まることを検証する。 */
export const expectContained = (layout: ModelGraphLayout) => {
  expect([layout.width, layout.height].every(Number.isFinite)).toBe(true);

  for (const node of layout.nodes) {
    expect(
      [node.x, node.y, node.width, node.height].every(Number.isFinite),
    ).toBe(true);
    expect(node.x).toBeGreaterThanOrEqual(0);
    expect(node.y).toBeGreaterThanOrEqual(0);
    expect(node.x + node.width).toBeLessThanOrEqual(layout.width);
    expect(node.y + node.height).toBeLessThanOrEqual(layout.height);
  }

  for (const point of layout.edges.flatMap((edge) => edge.points)) {
    expect([point.x, point.y].every(Number.isFinite)).toBe(true);
    expect(point.x).toBeGreaterThanOrEqual(0);
    expect(point.y).toBeGreaterThanOrEqual(0);
    expect(point.x).toBeLessThanOrEqual(layout.width);
    expect(point.y).toBeLessThanOrEqual(layout.height);
  }
};

/** 座標の具体値には依存せず、全カードの非重複を検証する。 */
export const expectNonOverlapping = (layout: ModelGraphLayout) => {
  layout.nodes.forEach((left, index) => {
    for (const right of layout.nodes.slice(index + 1)) {
      const separatedHorizontally =
        Math.max(left.x, right.x) >=
        Math.min(left.x + left.width, right.x + right.width);
      const separatedVertically =
        Math.max(left.y, right.y) >=
        Math.min(left.y + left.height, right.y + right.height);

      expect(separatedHorizontally || separatedVertically).toBe(true);
    }
  });
};

/** 経路が他のカードの内部を通らないことを線分ごとに検証する。 */
export const expectClearRoutes = (layout: ModelGraphLayout) => {
  const segments = layout.edges.flatMap((edge) =>
    edge.points
      .slice(1)
      .map((end, index) => ({ start: edge.points[index]!, end })),
  );

  for (const { start, end } of segments) {
    for (const node of layout.nodes) {
      const crossesX =
        Math.max(start.x, end.x) > node.x &&
        Math.min(start.x, end.x) < node.x + node.width;
      const crossesY =
        Math.max(start.y, end.y) > node.y &&
        Math.min(start.y, end.y) < node.y + node.height;

      expect(crossesX && crossesY).toBe(false);
    }
  }
};

export const mixedSource = `data 長い日本語の商品配送先住所と配送時の詳細情報 = string
data 注文 = 長い日本語の商品配送先住所と配送時の詳細情報 AND 明細 list AND 注文 option AND 未定義
data 明細 = 注文 AND 金額
data 金額 = int
data 別系統 = 別系統の参照先
data 別系統の参照先 = string
data 孤立 = string
data 循環A = 循環B
data 循環B = 循環C
data 循環C = 循環A
workflow 注文処理 =
  input: 注文
  output: 注文
  error: 未定義`;
