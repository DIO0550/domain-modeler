import { useId, type KeyboardEvent } from "react";
import { StateMachineConnectionHandles } from "./connection-handles";
import { GraphLabelInput } from "../graph-label-input";
import { StateMachineConnection } from "../../domains/state-machine-connection";
import { StateMachineGraph, type StateMachineGraphSelection } from "../../domains/state-machine-graph";
import { StateMachineLayout } from "../../domains/state-machine-layout";
import type { useStateMachineCanvas } from "../../hooks/use-state-machine-canvas";
import type { UseStateMachineViewResult } from "../../hooks/use-state-machine-view";

export function StateMachineGraphDrawing({ view, canvas }: Readonly<{
  view: UseStateMachineViewResult;
  canvas: ReturnType<typeof useStateMachineCanvas>;
}>) {
  const arrowId = useId();
  const { graph } = view;
  const { layout } = canvas;
  if (graph === null || layout === null) {
    return null;
  }
  const selectOnKeyDown = (keyboard: KeyboardEvent<SVGGElement>, selection: StateMachineGraphSelection) => {
    if (keyboard.key !== "Enter" && keyboard.key !== " ") {
      return;
    }
    keyboard.preventDefault();
    view.selectElement(selection);
  };
  return <div className="state-machine-screen__viewport" data-placing={canvas.placing}>
    {graph.nodes.length === 0 && <p className="state-machine-screen__canvas-hint">左の「状態」を選び、キャンバスをクリックして配置します。</p>}
    <svg ref={canvas.svgRef} className="state-machine-screen__graph" role="group" tabIndex={0}
      aria-label={`${graph.name} の状態遷移図`} viewBox={canvas.viewBox}
      onPointerDown={(event) => canvas.begin(event, { kind: "canvas" })}
      onPointerMove={canvas.move} onPointerUp={(event) => canvas.commit(event)}
      onPointerCancel={canvas.cancel} onLostPointerCapture={(event) => canvas.commit(event, true)}
      onKeyDown={canvas.keyDown}>
      <defs><marker id={arrowId} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M 0 0 L 9 4.5 L 0 9 Z" fill="var(--shell-muted)" /></marker></defs>
      {graph.edges.map((edge) => {
        const positioned = layout.edges.find((item) => item.id === edge.id);
        if (positioned === undefined) {
          return null;
        }
        const endpoints = StateMachineGraph.endpoints(graph, edge);
        return <g key={edge.id} className="state-machine-screen__edge" data-status={edge.status}
          data-selected={view.target.kind === "element" && view.target.selection.id === edge.id}
          tabIndex={0} role="button" aria-label={`${endpoints.from} から ${endpoints.to} へ、${edge.event}`}
          onPointerDown={(event) => { event.stopPropagation(); view.selectElement({ kind: "edge", id: edge.id }); }}
          onClick={() => view.selectElement({ kind: "edge", id: edge.id })}
          onKeyDown={(event) => selectOnKeyDown(event, { kind: "edge", id: edge.id })}>
          <path d={positioned.path} className="state-machine-screen__edge-line" markerEnd={`url(#${arrowId})`} />
          <path d={positioned.path} className="state-machine-screen__edge-hit" />
          <text x={positioned.label.x} y={positioned.label.y} textAnchor="middle">{edge.event}</text>
        </g>;
      })}
      {graph.nodes.map((node) => {
        const point = layout.nodes[node.id];
        if (point === undefined) {
          return null;
        }
        return <g key={node.id} className="state-machine-screen__node" data-status={node.status}
          data-selected={view.target.kind === "element" && view.target.selection.id === node.id}
          data-connection-candidate={canvas.connection.some && canvas.connection.value.kind === "connected" && canvas.connection.value.to === node.name}
          data-appearance={node.appearance} role="button" tabIndex={0} aria-label={`${node.name} ${node.appearance}`}
          onPointerDown={(event) => canvas.begin(event, { kind: "node", name: node.name })}
          onClick={() => view.selectElement({ kind: "node", id: node.id })}
          onKeyDown={(event) => selectOnKeyDown(event, { kind: "node", id: node.id })}>
          <rect x={point.x - StateMachineLayout.nodeSize.width / 2} y={point.y - StateMachineLayout.nodeSize.height / 2}
            width={StateMachineLayout.nodeSize.width} height={StateMachineLayout.nodeSize.height} rx="12" />
          <text x={point.x} y={point.y + 5} textAnchor="middle">{node.name}</text>
          {node.appearance.includes("initial") && <text x={point.x - StateMachineLayout.nodeSize.width / 2 + 15} y={point.y - 17} className="state-machine-screen__badge">●</text>}
          {node.appearance.includes("terminal") && <circle cx={point.x + StateMachineLayout.nodeSize.width / 2 - 18} cy={point.y - 17} r="7" fill="none" stroke="currentColor" strokeWidth="2" />}
        </g>;
      })}
      {canvas.connection.some && <path className="state-machine-screen__connection-preview"
        d={StateMachineConnection.path(canvas.connection.value)} markerEnd={`url(#${arrowId})`} />}
      {!canvas.draft.some && <StateMachineConnectionHandles view={view} canvas={canvas} />}
      {canvas.draft.some && <GraphLabelInput point={StateMachineConnection.label(canvas.draft.value, canvas.viewport)} label="新しい遷移のイベント名"
        onSubmit={canvas.submitConnection} onCancel={canvas.cancelConnection} />}
    </svg>
  </div>;
}
