import { ModelGraph } from "@domain-modeler/model-core";
import { expect } from "vitest";
import { AnalyzedModel } from "../../analyzed-model";

/** 実際のDSLから、カード変換の対象ノードを取り出す。 */
export function nodeFromSource(
  params: Readonly<{ source: string; name: string; occurrence?: number }>,
) {
  const analyzed = AnalyzedModel.create(params.source);
  const graph = ModelGraph.create({
    revision: 1,
    document: analyzed.document,
    resolution: analyzed,
    diagnostics: analyzed.diagnostics,
  });
  const node = graph.nodes.filter((item) => item.name === params.name)[
    params.occurrence ?? 0
  ];

  expect(node).toBeDefined();

  return node!;
}
