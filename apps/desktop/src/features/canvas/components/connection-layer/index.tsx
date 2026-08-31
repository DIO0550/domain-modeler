import { type MouseEvent, useRef } from "react";
import type { Connection, Document } from "@domain-modeler/canvas-core";
import {
  ConnectionAppearance,
  type ConnectionLabelAppearance,
} from "../../domains/connection-appearance";

const LABEL_HORIZONTAL_PADDING = 16;

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

/** 接続線の操作をキャンバス背景の操作へ伝播させない。 */
const stopConnectionEvent = (event: MouseEvent<SVGGElement>): void => {
  event.stopPropagation();
};

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
      onClick={stopConnectionEvent}
      onDoubleClick={stopConnectionEvent}
    >
      <title>{appearance.value.tooltip}</title>
      <path
        aria-hidden="true"
        className="connection-layer__hit-area"
        d={appearance.value.route.path}
      />
      <path
        className="connection-layer__path"
        d={appearance.value.route.path}
        markerEnd={marker}
      />
      {appearance.value.label.visibility === "visible" && (
        <ConnectionLabel label={appearance.value.label} />
      )}
    </g>
  );
}

type VisibleConnectionLabel = Extract<
  ConnectionLabelAppearance,
  { visibility: "visible" }
>;

type ConnectionLabelProps = Readonly<{
  label: VisibleConnectionLabel;
}>;

/** ラベルを実際のSVGテキスト幅に合わせた背景チップとともに描画する。 */
function ConnectionLabel({ label }: ConnectionLabelProps) {
  const chipRef = useRef<SVGRectElement>(null);
  const resizeChip = (text: SVGTextElement | null): void => {
    if (
      text === null ||
      chipRef.current === null ||
      typeof text.getComputedTextLength !== "function"
    ) {
      return;
    }
    const textWidth = text.getComputedTextLength();
    if (!Number.isFinite(textWidth)) {
      return;
    }
    const chipWidth = textWidth + LABEL_HORIZONTAL_PADDING;
    chipRef.current.setAttribute("x", String(-chipWidth / 2));
    chipRef.current.setAttribute("width", String(chipWidth));
  };

  return (
    <g
      className="connection-layer__label"
      pointerEvents="all"
      transform={`translate(${label.position.x} ${label.position.y})`}
    >
      <rect
        ref={chipRef}
        x={-LABEL_HORIZONTAL_PADDING / 2}
        y="-12"
        width={LABEL_HORIZONTAL_PADDING}
        height="24"
        rx="6"
      />
      <text
        ref={resizeChip}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label.text}
      </text>
    </g>
  );
}
