import { type ModelGraph, Result } from "@domain-modeler/model-core";

/** 意味的グラフとは別に導出する、一リビジョンの描画座標。座標はカード左上。 */
export type ModelGraphLayout = Readonly<{
  revision: number;
  width: number;
  height: number;
  nodes: readonly Readonly<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>[];
  edges: readonly Readonly<{
    id: string;
    from: string;
    to: string;
    points: readonly [
      Readonly<{ x: number; y: number }>,
      Readonly<{ x: number; y: number }>,
      ...Readonly<{ x: number; y: number }>[],
    ];
    path: string;
  }>[];
}>;

const MARGIN = 48;
const COLUMN_GAP = 96;
const ROW_GAP = 64;
const LANE_GAP = 24;

/** 可変寸法のモデルカードを配置する。本文・意味的グラフは変更しない。 */
export const ModelGraphLayout = {
  /** カードの始点へ集中する役割ラベルを、経路の最長区間へ分散する。 */
  labelPosition(
    edge: ModelGraphLayout["edges"][number],
  ): Readonly<{ x: number; y: number; anchor: "start" | "middle" }> {
    const segments = edge.points.slice(1).map((end, index) => {
      const start = edge.points[index];

      return {
        start,
        end,
        length: Math.abs(end.x - start.x) + Math.abs(end.y - start.y),
      };
    });
    const first = { start: edge.points[0], end: edge.points[1], length: 0 };
    const longest = segments.reduce(
      (maximum, segment) =>
        segment.length > maximum.length ? segment : maximum,
      first,
    );
    const vertical = longest.start.x === longest.end.x;

    return {
      x: (longest.start.x + longest.end.x) / 2 + (vertical ? 8 : 0),
      y: (longest.start.y + longest.end.y) / 2 - 10,
      anchor: vertical ? "start" : "middle",
    };
  },

  /**
   * 参照元から参照先へ列を割り当て、計測寸法を使ってノードと矢印を配置する。
   * @param graph 同一リビジョンの意味的グラフ。
   * @param sizes UIで計測したノードIDごとの寸法。
   * @returns 描画座標。不足・不正な寸法や接続はエラーとして返す。
   */
  create(
    graph: ModelGraph,
    sizes: ReadonlyMap<string, Readonly<{ width: number; height: number }>>,
  ): Result<ModelGraphLayout, string> {
    const measured = [];
    const ids = new Set<string>();

    for (const node of graph.nodes) {
      const size = sizes.get(node.id);

      if (size === undefined) {
        return Result.err(`ノード ${node.id} の寸法が未計測です`);
      }

      if (
        ![size.width, size.height].every(
          (value) => Number.isFinite(value) && value > 0,
        )
      ) {
        return Result.err(
          `ノード ${node.id} の寸法は正の有限数で指定してください`,
        );
      }

      if (ids.has(node.id)) {
        return Result.err(`ノードID ${node.id} が重複しています`);
      }

      ids.add(node.id);
      measured.push({ id: node.id, width: size.width, height: size.height });
    }

    if (graph.edges.some((edge) => !ids.has(edge.from) || !ids.has(edge.to))) {
      return Result.err("辺の接続先がグラフ内に存在しません");
    }

    const levels = ModelGraphLayout.collectLevels(graph);
    const columns = new Map<number, typeof measured>();

    for (const node of measured) {
      const level = levels.get(node.id)!;

      columns.set(level, [...(columns.get(level) ?? []), node]);
    }

    // 戻り辺・列をまたぐ辺のため、全カードより上に経路専用の余白を確保する。
    const top = MARGIN + graph.edges.length * LANE_GAP;
    const placed = new Map<string, ModelGraphLayout["nodes"][number]>();
    const corridors = new Map<
      string,
      Readonly<{ left: number; right: number }>
    >();
    let x = MARGIN;

    for (const [, column] of [...columns].sort(
      ([left], [right]) => left - right,
    )) {
      const width = column.reduce(
        (maximum, node) => Math.max(maximum, node.width),
        0,
      );
      let y = top;

      for (const node of column) {
        placed.set(node.id, { ...node, x, y });
        corridors.set(node.id, {
          left: x - LANE_GAP,
          right: x + width + LANE_GAP,
        });
        y += node.height + ROW_GAP;
      }

      x += width + COLUMN_GAP;
    }

    const nodes = measured.map((node) => placed.get(node.id)!);
    const edges = graph.edges.map((edge, index) => {
      const from = placed.get(edge.from)!;
      const to = placed.get(edge.to)!;
      const points = ModelGraphLayout.route(
        { from, to },
        {
          from: corridors.get(edge.from)!.right,
          to: corridors.get(edge.to)!.left,
          adjacentColumns: levels.get(edge.to) === levels.get(edge.from)! + 1,
        },
        MARGIN + index * LANE_GAP,
      );

      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        points,
        path: points
          .map(
            (point, index) =>
              `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
          )
          .join(" "),
      };
    });
    const width =
      nodes.reduce(
        (right, node) => Math.max(right, node.x + node.width),
        MARGIN,
      ) + MARGIN;
    const height =
      nodes.reduce(
        (bottom, node) => Math.max(bottom, node.y + node.height),
        MARGIN,
      ) + MARGIN;

    if (![width, height].every(Number.isFinite)) {
      return Result.err("配置結果が有限の描画範囲を超えています");
    }

    return Result.ok({ revision: graph.revision, width, height, nodes, edges });
  },

  /**
   * 入次数ゼロの宣言を優先し、その後に未到達の循環・非連結成分をソース順で探索する。
   * 到達済みノードは再訪しないため、循環でも反復回数はノード数で止まる。
   */
  collectLevels(
    graph: Pick<ModelGraph, "nodes" | "edges">,
  ): ReadonlyMap<string, number> {
    const outgoing = new Map<string, string[]>();
    const incoming = new Set(graph.edges.map((edge) => edge.to));

    for (const edge of graph.edges) {
      outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to]);
    }

    const roots = graph.nodes.filter((node) => !incoming.has(node.id));
    const seeds = [...roots, ...graph.nodes];
    const levels = new Map<string, number>(roots.map((node) => [node.id, 0]));
    const queue = roots.map((node) => node.id);
    let cursor = 0;

    for (const seed of seeds) {
      if (!levels.has(seed.id)) {
        levels.set(seed.id, 0);
        queue.push(seed.id);
      }

      while (cursor < queue.length) {
        const from = queue[cursor++]!;
        const next = (outgoing.get(from) ?? []).filter((id) => !levels.has(id));

        next.forEach((id) => levels.set(id, levels.get(from)! + 1));
        queue.push(...next);
      }
    }

    return levels;
  },

  /** 隣接列は隙間を使い、それ以外は列の外側と上部余白を通してカードを避ける。 */
  route(
    nodes: Readonly<{
      from: ModelGraphLayout["nodes"][number];
      to: ModelGraphLayout["nodes"][number];
    }>,
    corridors: Readonly<{
      from: number;
      to: number;
      adjacentColumns: boolean;
    }>,
    laneY: number,
  ): ModelGraphLayout["edges"][number]["points"] {
    const { from, to } = nodes;
    const start = { x: from.x + from.width, y: from.y + from.height / 2 };

    if (from.id === to.id) {
      const end = { x: from.x + from.width / 2, y: from.y };

      return [
        start,
        { x: corridors.from, y: start.y },
        { x: corridors.from, y: from.y - LANE_GAP },
        { x: end.x, y: from.y - LANE_GAP },
        end,
      ];
    }

    const end = { x: to.x, y: to.y + to.height / 2 };

    if (corridors.adjacentColumns) {
      return [
        start,
        { x: corridors.from, y: start.y },
        { x: corridors.from, y: end.y },
        end,
      ];
    }

    return [
      start,
      { x: corridors.from, y: start.y },
      { x: corridors.from, y: laneY },
      { x: corridors.to, y: laneY },
      { x: corridors.to, y: end.y },
      end,
    ];
  },
} as const;
