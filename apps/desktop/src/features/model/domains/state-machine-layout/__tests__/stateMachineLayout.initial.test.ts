import { expect, test } from "vitest";
import { AnalyzedModel } from "../../analyzed-model";
import { StateMachineGraph } from "../../state-machine-graph";
import { StateMachineLayout } from "..";

test.each([
  "",
  " terminal",
])("負の座標の初期状態%sも開始記号までフィット範囲に収まる", (terminal) => {
  const analyzed = AnalyzedModel.create(
    `state-machine 注文 =\n  initial: 待機\n  state: 待機${terminal}`,
  );
  const graph = StateMachineGraph.create(
    analyzed.stateMachines[0]!,
    analyzed.diagnostics,
  );
  const node = graph.nodes[0]!;
  const layout = StateMachineLayout.position(graph, {
    [node.id]: { x: -300, y: -200 },
  });
  const markerLeft =
    layout.nodes[node.id]!.x -
    StateMachineLayout.nodeSize.width / 2 -
    StateMachineLayout.initialMarkerSize.width;

  expect(layout.left).toBeLessThan(markerLeft);
  expect(layout.left + layout.width).toBeGreaterThan(
    layout.nodes[node.id]!.x + StateMachineLayout.nodeSize.width / 2,
  );
});
