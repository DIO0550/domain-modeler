import { useId } from "react";
import type { ModelGraph } from "@domain-modeler/model-core";
import { ModelGraphLayout } from "../../../domains/model-graph-layout";

const ROLE_LABELS = {
  component: "構成要素",
  choice: "選択肢",
  alias: "別名",
  input: "入力",
  output: "出力",
  error: "エラー",
} as const;

/**
 * 参照元から参照先への矢印と、集約された各役割を表示する。
 * @param props 意味的グラフと、そのカード寸法による配置。
 * @returns カードの背面に置く矢印レイヤー。
 */
export function DependencyEdges({
  graph,
  layout,
}: Readonly<{ graph: ModelGraph; layout: ModelGraphLayout }>) {
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
      {graph.edges.map((edge, index) => {
        const route = layout.edges[index];
        const from = graph.nodes.find((node) => node.id === edge.from)!;
        const to = graph.nodes.find((node) => node.id === edge.to)!;
        const roles = [
          ...new Set(edge.references.map((reference) => reference.role)),
        ];
        const labels = roles.map((role) => ROLE_LABELS[role]).join("・");
        const unresolved = to.kind === "unresolved";
        const warning = unresolved ? "（未定義）" : "";
        const position = ModelGraphLayout.labelPosition(route);
        const lines = roles.map((role) => ROLE_LABELS[role]);

        return (
          <g
            key={edge.id}
            data-from={edge.from}
            data-to={edge.to}
            data-unresolved={unresolved}
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
