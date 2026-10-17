import { Result } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import { DependencyDiagram } from "../dependency-diagram";
import { ModelGraphLayout } from "../model-graph-layout";

/** 計測した本文・再配置の世代と、その本文に対応する配置のスナップショット。 */
export type DependencyPlacement = Readonly<{
  diagram: DependencyDiagram;
  attempt: number;
  result: Result<ModelGraphLayout, string>;
}>;

type Measurement = Readonly<{
  diagram: DependencyDiagram;
  attempt: number;
  sizes: Parameters<typeof ModelGraphLayout.create>[1];
}>;

/** 構造と寸法が同じ更新では、最新IDへ対応させて閲覧中の配置を引き継ぐ。 */
export const DependencyPlacement = {
  create(
    measurement: Measurement,
    previous: Option<DependencyPlacement>,
  ): DependencyPlacement {
    const restored = Option.isSome(previous)
      ? DependencyPlacement.restore(previous.value, measurement)
      : Option.none();
    const result = Option.isSome(restored)
      ? Result.ok(restored.value)
      : ModelGraphLayout.create(measurement.diagram.graph, measurement.sizes);

    return {
      diagram: measurement.diagram,
      attempt: measurement.attempt,
      result,
    };
  },

  /** 行位置・宣言順が変わっても、一意な同名同種のノードと同じ接続だけを再利用する。 */
  restore(
    previous: DependencyPlacement,
    measurement: Measurement,
  ): Option<ModelGraphLayout> {
    if (
      previous.attempt !== measurement.attempt ||
      Result.isErr(previous.result)
    ) {
      return Option.none();
    }

    const graph = measurement.diagram.graph;
    const oldGraph = previous.diagram.graph;

    if (
      oldGraph.nodes.length !== graph.nodes.length ||
      oldGraph.edges.length !== graph.edges.length
    ) {
      return Option.none();
    }

    const ids = new Map<string, string>();

    for (const node of oldGraph.nodes) {
      const current = DependencyDiagram.currentNode(measurement.diagram, node);

      if (Option.isNone(current) || current.value.kind !== node.kind) {
        return Option.none();
      }

      ids.set(node.id, current.value.id);
    }

    const layout = previous.result.value;
    const sameSizes = layout.nodes.every((node) => {
      const size = measurement.sizes.get(ids.get(node.id)!);

      return (
        size !== undefined &&
        size.width === node.width &&
        size.height === node.height
      );
    });
    const edges = layout.edges.map((edge) => {
      const from = ids.get(edge.from)!;
      const to = ids.get(edge.to)!;
      const current = graph.edges.find(
        (item) => item.from === from && item.to === to,
      );

      return current === undefined
        ? Option.none()
        : Option.some({ ...edge, id: current.id, from, to });
    });

    if (!sameSizes || edges.some(Option.isNone)) {
      return Option.none();
    }

    if (previous.diagram === measurement.diagram) {
      return Option.some(layout);
    }

    return Option.some({
      ...layout,
      revision: graph.revision,
      nodes: layout.nodes.map((node) => ({ ...node, id: ids.get(node.id)! })),
      edges: edges.filter(Option.isSome).map((edge) => edge.value),
    });
  },
} as const;
