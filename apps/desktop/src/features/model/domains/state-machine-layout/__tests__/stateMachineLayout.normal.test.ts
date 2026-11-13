import { expect, test } from "vitest";
import { StateMachineGraph } from "../../state-machine-graph";
import { AnalyzedModel } from "../../analyzed-model";
import { StateMachineLayout } from "..";

test("循環と自己ループを含むグラフを有限の位置へ自動配置する", () => {
  const source = `state-machine 注文 =
  initial: 待機
  state: 待機
  state: 保留
  transition: 待機 -> 保留 on 保存
  transition: 保留 -> 待機 on 戻る
  transition: 待機 -> 待機 on 再試行`;
  const analyzed = AnalyzedModel.create(source);
  const resolution = analyzed.stateMachines[0]!;

  expect(resolution).toBeDefined();

  const graph = StateMachineGraph.create(resolution, analyzed.diagnostics);
  const layout = StateMachineLayout.create(graph);

  expect(layout.width).toBeGreaterThan(0);
  expect(Object.keys(layout.nodes)).toHaveLength(2);
  expect(layout.edges).toHaveLength(3);
  expect(layout.edges.every((edge) => edge.path.startsWith("M "))).toBe(true);
  expect(new Set(layout.edges.map((edge) => edge.path)).size).toBe(3);
});

test("ノードIDが Object.prototype のキー名と一致しても未配置として安全に扱う", () => {
  const source = `state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了
  transition: 待機 -> 完了 on 確定`;
  const analyzed = AnalyzedModel.create(source);
  const graph = StateMachineGraph.create(
    analyzed.stateMachines[0]!,
    analyzed.diagnostics,
  );
  const prototypeCollidingGraph: StateMachineGraph = {
    ...graph,
    nodes: graph.nodes.map((node, index) =>
      index === 0 ? { ...node, id: "toString" } : node,
    ),
    edges: graph.edges.map((edge) => ({ ...edge, from: "toString" })),
  };

  const layout = StateMachineLayout.position(prototypeCollidingGraph, {
    [graph.nodes[1]!.id]: { x: 200, y: 120 },
  });

  expect(Number.isFinite(layout.left)).toBe(true);
  expect(Number.isFinite(layout.width)).toBe(true);
  expect(layout.edges[0]?.path).toBe("");
});
