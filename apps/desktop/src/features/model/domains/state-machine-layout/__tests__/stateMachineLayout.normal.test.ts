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
  const resolution = analyzed.stateMachines[0];
  expect(resolution).toBeDefined();
  if (resolution === undefined) { return; }
  const graph = StateMachineGraph.create(resolution, analyzed.diagnostics);
  const layout = StateMachineLayout.create(graph);
  expect(layout.width).toBeGreaterThan(0);
  expect(Object.keys(layout.nodes)).toHaveLength(2);
  expect(layout.edges).toHaveLength(3);
  expect(layout.edges.every((edge) => edge.path.startsWith("M "))).toBe(true);
  expect(new Set(layout.edges.map((edge) => edge.path)).size).toBe(3);
});
