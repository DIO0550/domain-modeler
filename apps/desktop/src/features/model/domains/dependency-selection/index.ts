import { ModelGraph } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import { DependencyDiagram } from "../dependency-diagram";

/** 関連のみ表示では、必ず現在の選択ノードを持つ。 */
export type DependencySelection = Readonly<{
  diagram: DependencyDiagram;
  target:
    | Readonly<{ mode: "all"; node: Option<ModelGraph["nodes"][number]> }>
    | Readonly<{ mode: "related"; node: ModelGraph["nodes"][number] }>;
}>;

type SelectionAction =
  | Readonly<{ type: "select"; id: string }>
  | Readonly<{ type: "clear" }>
  | Readonly<{ type: "set-mode"; mode: DependencySelection["target"]["mode"] }>
  | Readonly<{ type: "synchronize"; diagram: DependencyDiagram }>;

/** 図の選択と表示範囲を一緒に更新し、未選択の関連表示を作らない。 */
export const DependencySelection = {
  create(
    diagram: DependencyDiagram,
    request: Readonly<{
      mode: DependencySelection["target"]["mode"];
      node: Option<ModelGraph["nodes"][number]>;
    }> = { mode: "all", node: Option.none() },
  ): DependencySelection {
    const node = Option.isSome(request.node)
      ? DependencyDiagram.currentNode(diagram, request.node.value)
      : Option.none();

    if (request.mode === "related" && Option.isSome(node)) {
      return { diagram, target: { mode: "related", node: node.value } };
    }

    return { diagram, target: { mode: "all", node } };
  },

  selectedNode(
    selection: DependencySelection,
  ): Option<ModelGraph["nodes"][number]> {
    if (selection.target.mode === "related") {
      return Option.some(selection.target.node);
    }

    return selection.target.node;
  },

  /** 本文更新で失われた選択は破棄し、全体表示へ戻す。 */
  synchronize(
    selection: DependencySelection,
    diagram: DependencyDiagram,
  ): DependencySelection {
    return DependencySelection.create(diagram, {
      mode: selection.target.mode,
      node: DependencySelection.selectedNode(selection),
    });
  },

  reduce(
    selection: DependencySelection,
    action: SelectionAction,
  ): DependencySelection {
    switch (action.type) {
      case "synchronize":
        return DependencySelection.synchronize(selection, action.diagram);
      case "clear":
        return DependencySelection.create(selection.diagram);
      case "select":
        return DependencySelection.create(selection.diagram, {
          mode: selection.target.mode,
          node: DependencyDiagram.selectedNode(selection.diagram, action.id),
        });
      case "set-mode":
        return DependencySelection.create(selection.diagram, {
          mode: action.mode,
          node: DependencySelection.selectedNode(selection),
        });
    }
  },

  /** 全文書の配置を維持したまま、表示するカードと直接接続だけを抽出する。 */
  visibleDiagram(selection: DependencySelection): Readonly<{
    cards: DependencyDiagram["cards"];
    graph: Pick<ModelGraph, "nodes" | "edges">;
  }> {
    const { diagram, target } = selection;

    if (target.mode === "all") {
      return { cards: diagram.cards, graph: diagram.graph };
    }

    const graph = ModelGraph.neighborhood(diagram.graph, target.node.id);
    const ids = new Set(graph.nodes.map((node) => node.id));

    return { cards: diagram.cards.filter((card) => ids.has(card.id)), graph };
  },
} as const;
