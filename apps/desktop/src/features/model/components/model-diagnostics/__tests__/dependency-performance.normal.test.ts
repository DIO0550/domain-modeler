import { expect, test } from "vitest";
import { AnalyzedModel } from "../../../domains/analyzed-model";
import { DependencyDiagram } from "../../../domains/dependency-diagram";
import { ModelGraphLayout } from "../../../domains/model-graph-layout";
import { dependencyPerformanceSource } from "./dependency-performance.test-support";

test.each([
  1, 10, 50,
])("計測用の%d組の文書を欠落や診断なしで配置できる", (groups) => {
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create(dependencyPerformanceSource(groups)),
  );
  const sizes = new Map(
    diagram.cards.map((card) => [card.id, { width: 280, height: 220 }]),
  );
  const layout = ModelGraphLayout.create(diagram.graph, sizes);

  expect(diagram.diagnostics).toEqual([]);
  expect(diagram.graph.nodes).toHaveLength(groups * 10);
  expect(diagram.graph.edges).toHaveLength(groups * 13);
  expect(layout).toMatchObject({
    ok: true,
    value: {
      nodes: expect.arrayContaining(
        diagram.graph.nodes.map((node) =>
          expect.objectContaining({ id: node.id }),
        ),
      ),
      edges: expect.arrayContaining(
        diagram.graph.edges.map((edge) =>
          expect.objectContaining({
            id: edge.id,
            from: edge.from,
            to: edge.to,
          }),
        ),
      ),
    },
  });
});
