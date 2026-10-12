import { ModelGraph } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import type { AnalyzedModel } from "../analyzed-model";
import { DependencyCard } from "../dependency-card";

/** 現在の解析結果から導出したグラフとカード。 */
export type DependencyDiagram = Readonly<{
  graph: ModelGraph;
  cards: readonly DependencyCard[];
  diagnostics: AnalyzedModel["diagnostics"];
}>;

/** 図の意味とカード表示を同一の解析結果から組み立てる。 */
export const DependencyDiagram = {
  create(analyzed: AnalyzedModel): DependencyDiagram {
    const graph = ModelGraph.create({
      revision: 0,
      document: analyzed.document,
      resolution: analyzed,
      diagnostics: analyzed.diagnostics,
    });

    return {
      graph,
      cards: graph.nodes.map(DependencyCard.create),
      diagnostics: analyzed.diagnostics,
    };
  },

  selectedCard(
    diagram: DependencyDiagram,
    selected: Option<string>,
  ): Option<DependencyCard> {
    if (Option.isNone(selected)) {
      return Option.none();
    }

    const card = diagram.cards.find((item) => item.id === selected.value);

    return card === undefined ? Option.none() : Option.some(card);
  },
} as const;
