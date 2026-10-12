import { expect, test } from "vitest";
import {
  expectClearRoutes,
  expectContained,
  expectLayout,
  expectNonOverlapping,
  mixedSource,
  setup,
} from "./modelGraphLayout.test-support";

test("小数寸法を累積した隣接列でも矢印は上部へ迂回せず列間を通る", () => {
  const input = setup(
    "data 注文 = 明細\ndata 明細 = 商品\ndata 商品 = 商品名\ndata 商品名 = string",
  );
  const sizes = new Map(
    input.graph.nodes.map((node) => [node.id, { width: 229.4, height: 80.3 }]),
  );
  const layout = expectLayout({ ...input, sizes });

  for (const edge of layout.edges) {
    const from = layout.nodes.find((node) => node.id === edge.from)!;
    const to = layout.nodes.find((node) => node.id === edge.to)!;
    const centerYs = [from.y + from.height / 2, to.y + to.height / 2];

    for (const point of edge.points) {
      expect(point.y).toBeGreaterThanOrEqual(Math.min(...centerYs));
      expect(point.y).toBeLessThanOrEqual(Math.max(...centerYs));
    }
  }

  expectClearRoutes(layout);
});

test("長い日本語名と多数の項目を含む計測カードを重ねずに配置する", () => {
  const input = setup(mixedSource);
  const layout = expectLayout(input);

  expectNonOverlapping(layout);
  expect(
    layout.nodes.map(({ id, width, height }) => ({ id, width, height })),
  ).toEqual(
    input.graph.nodes.map(({ id }) => ({ id, ...input.sizes.get(id) })),
  );
});

test("循環・自己参照・非連結成分・孤立宣言を含む全ノードと辺を保持する", () => {
  const input = setup(mixedSource);
  const layout = expectLayout(input);

  expect(layout.nodes.map((node) => node.id)).toEqual(
    input.graph.nodes.map((node) => node.id),
  );
  expect(layout.edges.map(({ id, from, to }) => ({ id, from, to }))).toEqual(
    input.graph.edges.map(({ id, from, to }) => ({ id, from, to })),
  );
  expect(layout.revision).toBe(input.graph.revision);
  expectContained(layout);
});

test("すべての矢印は参照元の右辺から出て参照先の境界で終わる", () => {
  const layout = expectLayout(setup(mixedSource));

  for (const edge of layout.edges) {
    const from = layout.nodes.find((node) => node.id === edge.from)!;
    const to = layout.nodes.find((node) => node.id === edge.to)!;
    const end =
      edge.from === edge.to
        ? { x: to.x + to.width / 2, y: to.y }
        : { x: to.x, y: to.y + to.height / 2 };

    expect(edge.points[0]).toEqual({
      x: from.x + from.width,
      y: from.y + from.height / 2,
    });
    expect(edge.points[edge.points.length - 1]).toEqual(end);
    expect(
      edge.path.startsWith(
        `M ${from.x + from.width} ${from.y + from.height / 2} L `,
      ),
    ).toBe(true);
    expect(edge.path.endsWith(`L ${end.x} ${end.y}`)).toBe(true);
  }
});

test("自己ループ・戻り辺・列を飛び越す辺がカードの内部を通らない", () => {
  const layout = expectLayout(setup(mixedSource));

  expectClearRoutes(layout);
});

test("同じグラフと寸法では寸法Mapの挿入順によらず同じ配置になる", () => {
  const input = setup(mixedSource);
  const first = expectLayout(input);
  const second = expectLayout({
    ...input,
    sizes: new Map([...input.sizes].reverse()),
  });

  expect(second).toEqual(first);
});

test("配置で意味的グラフ・参照情報・計測寸法を変更しない", () => {
  const input = setup(mixedSource);
  const graphBefore = structuredClone(input.graph);
  const sizesBefore = structuredClone(input.sizes);

  expectLayout(input);

  expect(input.graph).toEqual(graphBefore);
  expect(input.sizes).toEqual(sizesBefore);
});

test("計測寸法が大きくなったカードも再配置で重ならない", () => {
  const input = setup(mixedSource);
  const sizes = new Map(
    [...input.sizes].map(([id]) => [id, { width: 1800, height: 3200 }]),
  );
  const layout = expectLayout({ ...input, sizes });

  expectNonOverlapping(layout);
  expectContained(layout);
  expectClearRoutes(layout);
});

test("宣言順と逆向きの参照でも参照元から参照先へ配置する", () => {
  const input = setup("data 参照先 = string\ndata 参照元 = 参照先");
  const layout = expectLayout(input);

  expect(layout.nodes[1]!.x + layout.nodes[1]!.width).toBeLessThan(
    layout.nodes[0]!.x,
  );
});
