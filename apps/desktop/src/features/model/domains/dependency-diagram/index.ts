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
  create(analyzed: AnalyzedModel, revision = 0): DependencyDiagram {
    const graph = ModelGraph.create({
      revision,
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

  /** 本文が変わったときだけ、次のリビジョンの解析・図を採用する。 */
  synchronize(
    diagram: DependencyDiagram,
    analyzed: AnalyzedModel,
  ): DependencyDiagram {
    if (diagram.source === analyzed.source) {
      return diagram;
    }

    return DependencyDiagram.create(analyzed, diagram.graph.revision + 1);
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

    const candidates = diagram.graph.nodes.filter((node) => {
      if (node.name !== previous.name || node.label !== node.name) {
        return false;
      }

      // 未定義名に一意な定義が追加されたときだけ、種類をまたいで引き継ぐ。
      return previous.kind === "unresolved" || node.kind === previous.kind;
    });

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
