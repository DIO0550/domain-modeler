import {
  type ChangeEvent,
  useEffect,
  type KeyboardEvent,
  type MouseEvent,
  useMemo,
  useRef,
} from "react";
import {
  type Connection,
  type ConnectionId,
  type Document,
  type StickyIndex as StickyIndexType,
  StickyIndex,
} from "@domain-modeler/canvas-core";
import { ConnectionAppearance } from "../../domains/connection-appearance";
import {
  ConnectionSession,
  type ConnectionSession as ConnectionSessionType,
} from "../../domains/connection-session";

const LABEL_HORIZONTAL_PADDING = 16;

type ConnectionLayerProps = Readonly<{
  document: Document;
  interaction?: Readonly<{
    session: ConnectionSessionType;
    onSelect: (connectionId: ConnectionId) => void;
    onEdit: (connectionId: ConnectionId) => void;
    onDraftChange: (draftLabel: string) => void;
    onCommitEdit: () => void;
  }>;
}>;

/**
 * core が解決した接続をSVGで描画するキャンバスレイヤー。
 *
 * @param props 描画する文書。
 * @returns 矢印、ラベル、警告表示を含むSVGレイヤー。
 */
export function ConnectionLayer({ document, interaction }: ConnectionLayerProps) {
  const stickyIndex = useMemo(
    () => StickyIndex.create(document.stickies),
    [document.stickies],
  );
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
          stickyIndex={stickyIndex}
          connection={connection}
          interaction={interaction}
        />
      ))}
    </svg>
  );
}

type RenderedConnectionProps = Readonly<{
  stickyIndex: StickyIndexType;
  connection: Connection;
  interaction: ConnectionLayerProps["interaction"];
}>;

/**
 * 解決できた接続1本を描画する。
 *
 * @param props 文書と接続。
 * @returns 接続のSVGグループ。端点を解決できない場合は何も描画しない。
 */
function RenderedConnection({
  stickyIndex,
  connection,
  interaction,
}: RenderedConnectionProps) {
  const appearance = ConnectionAppearance.create(stickyIndex, connection);
  if (!appearance.some) {
    return null;
  }
  const marker =
    appearance.value.status === "warning"
      ? "url(#connection-warning-arrow)"
      : "url(#connection-arrow)";
  const session = interaction?.session ?? ({ status: "idle" } as const);
  const connectionStatus = ConnectionSession.statusOf(session, connection.id);
  const draftLabel =
    session.status === "editing" && session.connectionId === connection.id
      ? session.draftLabel
      : connection.label;

  return (
    <g
      className="connection-layer__connection"
      data-connection-id={connection.id}
      data-connection-status={appearance.value.status}
      data-connection-shape={appearance.value.route.shape}
      data-connection-session={connectionStatus}
      role={interaction === undefined ? undefined : "button"}
      aria-label={
        interaction === undefined ? undefined : connectionAccessibleName(connection)
      }
      tabIndex={interaction === undefined ? undefined : 0}
      onClick={(event) => {
        selectConnection(event, interaction, connection.id);
      }}
      onDoubleClick={(event) => {
        editConnection(event, interaction, connection.id);
      }}
      onKeyDown={(event) => {
        handleConnectionKeyDown(event, interaction, connection.id);
      }}
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
      {connectionStatus !== "plain" && connectionStatus !== "editing" && (
        <ConnectionEndpoints endpoints={appearance.value.endpoints} />
      )}
      {connectionStatus === "editing" && interaction !== undefined && (
        <ConnectionLabelEditor
          position={appearance.value.route.midpoint}
          draftLabel={draftLabel}
          onDraftChange={interaction.onDraftChange}
          onCommit={interaction.onCommitEdit}
        />
      )}
    </g>
  );
}

/** 接続クリックを選択として渡し、キャンバス背景へ伝播させない。 */
const selectConnection = (
  event: MouseEvent<SVGGElement>,
  interaction: ConnectionLayerProps["interaction"],
  connectionId: ConnectionId,
): void => {
  event.stopPropagation();
  interaction?.onSelect(connectionId);
};

/** 接続ダブルクリックをラベル編集として渡す。 */
const editConnection = (
  event: MouseEvent<SVGGElement>,
  interaction: ConnectionLayerProps["interaction"],
  connectionId: ConnectionId,
): void => {
  event.stopPropagation();
  interaction?.onEdit(connectionId);
};

/** フォーカス中の接続で Enter を押すとラベル編集を始める。 */
const handleConnectionKeyDown = (
  event: KeyboardEvent<SVGGElement>,
  interaction: ConnectionLayerProps["interaction"],
  connectionId: ConnectionId,
): void => {
  if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
    return;
  }
  if (event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  interaction?.onEdit(connectionId);
};

/** 接続のラベル、または ID を使った読み上げ名を返す。 */
const connectionAccessibleName = (connection: Connection): string =>
  connection.label.length === 0
    ? `接続 ${connection.id}`
    : `接続 ${connection.label}`;

type ConnectionEndpointsProps = Readonly<{
  endpoints: ConnectionAppearance["endpoints"];
}>;

/** 選択中の接続の始点と終点を強調する。 */
function ConnectionEndpoints({ endpoints }: ConnectionEndpointsProps) {
  return (
    <g className="connection-layer__endpoints" aria-hidden="true">
      <circle cx={endpoints.from.x} cy={endpoints.from.y} r="5" />
      <circle cx={endpoints.to.x} cy={endpoints.to.y} r="5" />
    </g>
  );
}

type ConnectionLabelEditorProps = Readonly<{
  position: ConnectionAppearance["route"]["midpoint"];
  draftLabel: string;
  onDraftChange: (draftLabel: string) => void;
  onCommit: () => void;
}>;

/** 経路の中点で接続ラベルをインライン編集する。 */
function ConnectionLabelEditor({
  position,
  draftLabel,
  onDraftChange,
  onCommit,
}: ConnectionLabelEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <foreignObject
      className="connection-layer__label-editor"
      x={position.x - 90}
      y={position.y - 18}
      width="180"
      height="36"
    >
      <input
        ref={inputRef}
        aria-label="接続ラベル"
        value={draftLabel}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onDraftChange(event.target.value);
        }}
        onBlur={onCommit}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
            return;
          }
          if (event.key !== "Enter" && event.key !== "Escape") {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.blur();
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
        }}
      />
    </foreignObject>
  );
}

type VisibleConnectionLabel = Extract<
  ConnectionAppearance["label"],
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
