import { useId } from "react";
import { Option } from "@/utils/Option";
import { DependencyCard } from "../../../domains/dependency-card";
import type { ModelGraph } from "@domain-modeler/model-core";
import { ModelGraphLayout } from "../../../domains/model-graph-layout";

/**
 * 参照元から参照先への矢印と、集約された各役割を表示する。
 * @param props 意味的グラフと、そのカード寸法による配置。
 * @returns カードの背面に置く矢印レイヤー。
 */
export function DependencyEdges({
  graph,
  layout,
  neighborhood = Option.none(),
}: Readonly<{
  graph: Pick<ModelGraph, "nodes" | "edges">;
  layout: ModelGraphLayout;
  neighborhood?: Option<Pick<ModelGraph, "nodes" | "edges">>;
}>) {
  const arrowId = useId();

  return (
    <svg
      className="dependency-view__edges"
      width={layout.width}
      height={layout.height}
      role="img"
      aria-label="参照する宣言から参照される宣言への矢印"
    >
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
      {graph.edges.map((edge) => {
        const route = layout.edges.find((item) => item.id === edge.id)!;
        const from = graph.nodes.find((node) => node.id === edge.from)!;
        const to = graph.nodes.find((node) => node.id === edge.to)!;
        const roles = [
          ...new Set(edge.references.map((reference) => reference.role)),
        ];
        const labels = roles.map(DependencyCard.roleLabel).join("・");
        const unresolved = to.kind === "unresolved";
        const warning = unresolved ? "（未定義）" : "";
        const position = ModelGraphLayout.labelPosition(route);
        const lines = roles.map(DependencyCard.roleLabel);

        return (
          <g
            key={edge.id}
            data-from={edge.from}
            data-to={edge.to}
            data-unresolved={unresolved}
            data-related={
              Option.isSome(neighborhood) &&
              neighborhood.value.edges.some((item) => item.id === edge.id)
            }
            aria-label={`${from.label} → ${to.label}: ${labels}${warning}`}
          >
            <title>{`${from.label} → ${to.label}: ${labels}${warning}`}</title>
            <path d={route.path} markerEnd={`url(#${arrowId})`} />
            <text x={position.x} y={position.y} textAnchor={position.anchor}>
              {lines.map((line, lineIndex) => (
                <tspan key={line} x={position.x} dy={lineIndex === 0 ? 0 : 16}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
