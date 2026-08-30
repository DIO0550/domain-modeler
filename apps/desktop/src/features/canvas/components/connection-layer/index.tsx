import type { Connection, Document } from "@domain-modeler/canvas-core";
import { ConnectionAppearance } from "../../domains/connection-appearance";

type ConnectionLayerProps = Readonly<{
  document: Document;
}>;

/**
 * core が解決した接続をSVGで描画するキャンバスレイヤー。
 *
 * @param props 描画する文書。
 * @returns 矢印、ラベル、警告表示を含むSVGレイヤー。
 */
export function ConnectionLayer({ document }: ConnectionLayerProps) {
  return (
    <svg
      className="connection-layer"
      aria-label="接続線"
      width="100%"
      height="100%"
    >
      <defs>
        <marker
          id="connection-arrow"
          className="connection-layer__arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
        <marker
          id="connection-warning-arrow"
          className="connection-layer__arrow connection-layer__arrow--warning"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      {document.connections.map((connection) => (
        <RenderedConnection
          key={connection.id}
          document={document}
          connection={connection}
        />
      ))}
    </svg>
  );
}

type RenderedConnectionProps = Readonly<{
  document: Document;
  connection: Connection;
}>;

/**
 * 解決できた接続1本を描画する。
 *
 * @param props 文書と接続。
 * @returns 接続のSVGグループ。端点を解決できない場合は何も描画しない。
 */
function RenderedConnection({
  document,
  connection,
}: RenderedConnectionProps) {
  const appearance = ConnectionAppearance.create(document, connection);
  if (!appearance.some) {
    return null;
  }
  const marker =
    appearance.value.status === "warning"
      ? "url(#connection-warning-arrow)"
      : "url(#connection-arrow)";

  return (
    <g
      className="connection-layer__connection"
      data-connection-id={connection.id}
      data-connection-status={appearance.value.status}
      data-connection-shape={appearance.value.route.shape}
    >
      <title>{appearance.value.tooltip}</title>
      <path
        className="connection-layer__path"
        d={appearance.value.route.path}
        markerEnd={marker}
      />
      {appearance.value.label.visibility === "visible" && (
        <g
          className="connection-layer__label"
          transform={`translate(${appearance.value.label.position.x} ${appearance.value.label.position.y})`}
        >
          <rect
            x={-appearance.value.label.width / 2}
            y="-12"
            width={appearance.value.label.width}
            height="24"
            rx="6"
          />
          <text textAnchor="middle" dominantBaseline="central">
            {appearance.value.label.text}
          </text>
        </g>
      )}
    </g>
  );
}
