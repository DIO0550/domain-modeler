import type { StateMachineGraph } from "../state-machine-graph";

export type GraphPoint = Readonly<{ x: number; y: number }>;
export type StateMachineLayout = Readonly<{
  width: number;
  height: number;
  nodes: Readonly<Record<string, GraphPoint>>;
  edges: readonly Readonly<{ id: string; path: string; label: GraphPoint }>[];
}>;

const NODE_WIDTH = 160;
const NODE_HEIGHT = 64;
const COLUMN = 260;
const ROW = 150;
const MARGIN = 100;

/** Stable left-to-right layering, including cycles and disconnected states. */
export const StateMachineLayout = {
  create(graph: StateMachineGraph): StateMachineLayout {
    const ids = graph.nodes.map((node) => node.id);
    const levels = new Map(ids.map((id) => [id, 0]));
    const initial = graph.nodes.filter((node) => node.appearance.includes("initial"));
    const roots = initial.length > 0 ? initial : graph.nodes.slice(0, 1);
    const queue = roots.map((node) => node.id);
    const reached = new Set(queue);
    while (queue.length > 0) {
      const from = queue.shift();
      if (from === undefined) {
        continue;
      }
      for (const edge of graph.edges.filter((item) => item.from === from)) {
        if (reached.has(edge.to)) {
          continue;
        }
        reached.add(edge.to);
        levels.set(edge.to, (levels.get(from) ?? 0) + 1);
        queue.push(edge.to);
      }
    }
    const columns = new Map<number, string[]>();
    for (const id of ids) {
      const level = levels.get(id) ?? 0;
      columns.set(level, [...(columns.get(level) ?? []), id]);
    }
    const nodes: Record<string, GraphPoint> = {};
    for (const [level, column] of columns) {
      column.forEach((id, index) => {
        nodes[id] = { x: MARGIN + level * COLUMN, y: MARGIN + index * ROW };
      });
    }
    const maxLevel = Math.max(0, ...columns.keys());
    const maxRows = Math.max(1, ...[...columns.values()].map((column) => column.length));
    const edges = graph.edges.map((edge, index) => {
      const from = nodes[edge.from];
      const to = nodes[edge.to];
      if (from === undefined || to === undefined) {
        return { id: edge.id, path: "", label: { x: 0, y: 0 } };
      }
      const parallel = graph.edges.slice(0, index).filter((item) => item.from === edge.from && item.to === edge.to).length;
      if (edge.from === edge.to) {
        const x = from.x + NODE_WIDTH / 2;
        const y = from.y - NODE_HEIGHT / 2;
        const lift = 55 + parallel * 28;
        return {
          id: edge.id,
          path: `M ${x - 30} ${y} C ${x - 75} ${y - lift}, ${x + 75} ${y - lift}, ${x + 30} ${y}`,
          label: { x, y: y - lift + 12 },
        };
      }
      const direction = to.x >= from.x ? 1 : -1;
      const startX = from.x + direction * NODE_WIDTH / 2;
      const endX = to.x - direction * NODE_WIDTH / 2;
      const shift = parallel * 24;
      const startY = from.y + shift;
      const endY = to.y + shift;
      const middleX = (startX + endX) / 2;
      return {
        id: edge.id,
        path: `M ${startX} ${startY} C ${middleX} ${startY}, ${middleX} ${endY}, ${endX} ${endY}`,
        label: { x: middleX, y: (startY + endY) / 2 - 12 },
      };
    });
    return {
      width: MARGIN * 2 + maxLevel * COLUMN + NODE_WIDTH,
      height: MARGIN * 2 + (maxRows - 1) * ROW + NODE_HEIGHT,
      nodes,
      edges,
    };
  },
} as const;
