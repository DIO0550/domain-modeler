import type { ModelGraph, SourceRange } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import { CaretPosition } from "../caret-position";
import { DependencyCard } from "../dependency-card";
import type { DependencyDiagram } from "../dependency-diagram";

type DependencyRelation = Readonly<{
  node: ModelGraph["nodes"][number];
  references: ModelGraph["references"];
}>;

/** 選択したモデルの定義、両方向の接続先と各参照箇所。 */
export type DependencyInspection = Readonly<{
  node: ModelGraph["nodes"][number];
  card: DependencyCard;
  definition: Option<Readonly<{ range: SourceRange; text: string }>>;
  dependencies: readonly DependencyRelation[];
  referrers: readonly DependencyRelation[];
}>;

/** 同じ本文のグラフとソース範囲から、読み取り専用の選択内容を導出する。 */
export const DependencyInspection = {
  create(
    diagram: DependencyDiagram,
    selectedId: string,
  ): Option<DependencyInspection> {
    const node = diagram.graph.nodes.find((item) => item.id === selectedId);

    if (node === undefined) {
      return Option.none();
    }

    return Option.some({
      node,
      card: DependencyCard.create(node),
      definition: DependencyInspection.definition(diagram.source, node),
      dependencies: DependencyInspection.relations(diagram.graph, {
        selectedId,
        direction: "outgoing",
      }),
      referrers: DependencyInspection.relations(diagram.graph, {
        selectedId,
        direction: "incoming",
      }),
    });
  },

  /** 未定義名には宣言本文を作らず、実際の宣言範囲だけを読み取る。 */
  definition(
    source: string,
    node: ModelGraph["nodes"][number],
  ): DependencyInspection["definition"] {
    if (node.kind === "unresolved") {
      return Option.none();
    }

    const selection = CaretPosition.selectionFromRange(
      source,
      node.declaration.range,
    );

    if (Option.isNone(selection)) {
      return Option.none();
    }

    return Option.some({
      range: node.declaration.range,
      text: source.slice(selection.value.start, selection.value.end),
    });
  },

  /** 接続先ごとに集約しながら、複数役割・同一役割の各出現を保持する。 */
  relations(
    graph: ModelGraph,
    selection: Readonly<{
      selectedId: string;
      direction: "outgoing" | "incoming";
    }>,
  ): readonly DependencyRelation[] {
    return graph.nodes.flatMap((node) => {
      const references = graph.edges
        .filter((edge) => {
          if (selection.direction === "outgoing") {
            return edge.from === selection.selectedId && edge.to === node.id;
          }

          return edge.to === selection.selectedId && edge.from === node.id;
        })
        .flatMap((edge) => edge.references);

      return references.length === 0 ? [] : [{ node, references }];
    });
  },
} as const;
