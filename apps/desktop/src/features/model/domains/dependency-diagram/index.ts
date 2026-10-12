import { ModelGraph } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import type { AnalyzedModel } from "../analyzed-model";
import { DependencyCard } from "../dependency-card";

/** 現在の解析結果から導出したグラフとカード。 */
export type DependencyDiagram = Readonly<{
  source: string;
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
      source: analyzed.source,
      graph,
      cards: graph.nodes.map(DependencyCard.create),
      diagnostics: analyzed.diagnostics,
    };
  },

  /** 選択IDに対応する現在のノードを返す。 */
  selectedNode(
    diagram: DependencyDiagram,
    id: string,
  ): Option<ModelGraph["nodes"][number]> {
    const node = diagram.graph.nodes.find((item) => item.id === id);

    return node === undefined ? Option.none() : Option.some(node);
  },

  /** 本文更新後は一意の名前と宣言種別で再特定し、重複名を推測しない。 */
  currentNode(
    diagram: DependencyDiagram,
    previous: ModelGraph["nodes"][number],
  ): Option<ModelGraph["nodes"][number]> {
    if (diagram.graph.nodes.includes(previous)) {
      return Option.some(previous);
    }

    if (previous.label !== previous.name) {
      return Option.none();
    }

    const candidates = diagram.graph.nodes.filter(
      (node) => node.name === previous.name && node.kind === previous.kind,
    );

    return candidates.length === 1 ? Option.some(candidates[0]) : Option.none();
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
