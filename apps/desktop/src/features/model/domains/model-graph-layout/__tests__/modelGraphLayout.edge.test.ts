import { expect, test } from "vitest";
import { ModelGraphLayout } from "..";
import {
  expectContained,
  expectLayout,
  expectNonOverlapping,
  setup,
} from "./modelGraphLayout.test-support";

test("空のグラフにも有限の描画範囲を返す", () => {
  const layout = expectLayout(setup(""));

  expect(layout.nodes).toEqual([]);
  expect(layout.edges).toEqual([]);
  expectContained(layout);
});

test("未計測のカードを仮の寸法で配置せずエラーを返す", () => {
  const { graph } = setup("data 注文 = string");

  expect(ModelGraphLayout.create(graph, new Map()).ok).toBe(false);
});

test.each([
  0,
  -1,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
])("不正な幅 %s を拒否する", (width) => {
  const { graph } = setup("data 注文 = string");
  const sizes = new Map([[graph.nodes[0]!.id, { width, height: 100 }]]);

  expect(ModelGraphLayout.create(graph, sizes).ok).toBe(false);
});

test.each([
  0,
  -1,
  Number.NaN,
  Number.POSITIVE_INFINITY,
])("不正な高さ %s を拒否する", (height) => {
  const { graph } = setup("data 注文 = string");
  const sizes = new Map([[graph.nodes[0]!.id, { width: 100, height }]]);

  expect(ModelGraphLayout.create(graph, sizes).ok).toBe(false);
});

test("存在しない接続先への辺を黙って削除しない", () => {
  const { graph, sizes } = setup("data 注文 = string");
  const missingTarget = {
    ...graph,
    edges: [
      {
        id: "missing",
        from: graph.nodes[0]!.id,
        to: "missing",
        references: [],
      },
    ],
  };

  expect(ModelGraphLayout.create(missingTarget, sizes).ok).toBe(false);
});

test("重複IDでノードを上書きしない", () => {
  const { graph, sizes } = setup("data 注文 = string");

  expect(
    ModelGraphLayout.create(
      { ...graph, nodes: [...graph.nodes, ...graph.nodes] },
      sizes,
    ).ok,
  ).toBe(false);
});

test("計算中に寸法がオーバーフローした場合は配置を返さない", () => {
  const { graph } = setup("data 注文 = string\ndata 明細 = string");
  const sizes = new Map(
    graph.nodes.map((node) => [
      node.id,
      { width: 100, height: Number.MAX_VALUE },
    ]),
  );

  expect(ModelGraphLayout.create(graph, sizes).ok).toBe(false);
});

test("長い循環参照でも再帰の深さに依存せず全ノードを配置する", () => {
  const source = Array.from(
    { length: 2000 },
    (_, index) => `data 型${index} = 型${(index + 1) % 2000}`,
  ).join("\n");
  const input = setup(source);
  const layout = expectLayout(input);

  expect(layout.nodes).toHaveLength(2000);
  expect(layout.edges).toHaveLength(2000);
  expectContained(layout);
});

test("小数寸法と同名の重複宣言も別カードとして配置する", () => {
  const input = setup("data 注文 = 注文\ndata 注文 = string");
  const sizes = new Map(
    input.graph.nodes.map((node) => [node.id, { width: 0.5, height: 0.25 }]),
  );
  const layout = expectLayout({ ...input, sizes });

  expect(layout.nodes).toHaveLength(2);
  expectNonOverlapping(layout);
  expectContained(layout);
});
