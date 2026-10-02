import { useId, type KeyboardEvent, type MouseEvent } from "react";
import { Result } from "@domain-modeler/model-core";
import {
  StateMachineGraph,
  type StateMachineGraphSelection,
} from "../../domains/state-machine-graph";
import { StateMachineLayout } from "../../domains/state-machine-layout";
import { StateMachineSource } from "../../domains/state-machine-source";
import { useStateMachineConnection } from "../../hooks/use-state-machine-connection";
import { useStateMachineViewport } from "../../hooks/use-state-machine-viewport";
import { useStateMachineContext } from "./context";

export function StateMachineGraphPanel() {
  const context = useStateMachineContext();
  if (!context.some) {
    return null;
  }
  const { view } = context.value;
  return (
    <section className="state-machine-screen__center" aria-label="ステートマシンのグラフ">
      <header className="state-machine-screen__toolbar">
        <div className="state-machine-screen__machine">
          <label>ステートマシン
            <select value={view.selectedMachineIndex} disabled={view.analyzed.stateMachines.length === 0}
              onChange={(change) => view.selectMachine(Number(change.target.value))}>
              {view.analyzed.stateMachines.length === 0 && <option value={-1}>未作成</option>}
              {view.analyzed.stateMachines.map((machine, index) => (
                <option key={`${machine.machine.name}-${machine.machine.range.startLine}`} value={index}>
                  {machine.machine.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" aria-pressed={view.target.kind === "machine"} onClick={view.startMachineCreation}>
            ＋ 新しいマシン
          </button>
        </div>
        <div className="state-machine-screen__zoom" role="group" aria-label="グラフの倍率">
          <button type="button" aria-label="縮小" disabled={view.graph === null} onClick={() => view.zoomBy(1 / 1.25)}>−</button>
          <output aria-label="現在の倍率">{Math.round(view.zoom * 100)}%</output>
          <button type="button" disabled={view.graph === null} onClick={view.fit}>フィット</button>
          <button type="button" aria-label="拡大" disabled={view.graph === null} onClick={() => view.zoomBy(1.25)}>＋</button>
        </div>
      </header>
      <StateMachineGraphContent />
    </section>
  );
}

function StateMachineGraphContent() {
  const context = useStateMachineContext();
  const arrowId = useId();
  const connection = useStateMachineConnection({
    onConnect: (fromId, toId) => {
      if (!context.some) {
        return;
      }
      const { view } = context.value;
      const from = view.graph?.nodes.find((node) => node.id === fromId);
      const to = view.graph?.nodes.find((node) => node.id === toId);
      if (from === undefined || to === undefined || to.appearance === "unresolved") {
        return;
      }
      view.drawTransition(from.name, to.name);
    },
  });
  const layoutSize = context.some ? context.value.view.layout : null;
  const viewport = useStateMachineViewport({
    center: { x: (layoutSize?.width ?? 0) / 2, y: (layoutSize?.height ?? 0) / 2 },
    onPan: (delta) => {
      if (context.some) {
        context.value.view.panBy(delta);
      }
    },
    onZoom: (factor, anchor) => {
      if (context.some) {
        context.value.view.zoomBy(factor, anchor);
      }
    },
  });
  if (!context.some) {
    return null;
  }
  const { view, value, onChange } = context.value;
  const drag = connection.drag.some ? connection.drag.value : undefined;
  const { graph, layout } = view;
  const selectOnKeyDown = (keyboard: KeyboardEvent<SVGGElement>, selection: StateMachineGraphSelection) => {
    if (keyboard.key !== "Enter" && keyboard.key !== " ") {
      return;
    }
    keyboard.preventDefault();
    view.selectElement(selection);
  };
  const removeOnKeyDown = (keyboard: KeyboardEvent<SVGSVGElement>) => {
    if (keyboard.key !== "Delete" && keyboard.key !== "Backspace") {
      return;
    }
    keyboard.preventDefault();
    const { inspection, resolution } = view;
    if (resolution === null || inspection === null || inspection.kind === "machine") {
      return;
    }
    if (inspection.kind === "node" && inspection.node.appearance === "unresolved") {
      return;
    }
    const target = inspection.kind === "node"
      ? { kind: "state" as const, name: inspection.node.name }
      : { kind: "transition" as const, range: inspection.edge.range };
    const removed = StateMachineSource.remove(value, resolution, target);
    if (Result.isErr(removed)) {
      return;
    }
    onChange(removed.value);
    view.clearSelection();
    keyboard.currentTarget.focus();
  };
  const clearOnBlankClick = (click: MouseEvent<SVGSVGElement>) => {
    if (click.target instanceof Element && click.target.closest('[role="button"]') !== null) {
      return;
    }
    view.clearSelection();
    click.currentTarget.focus();
  };

  if (graph === null) {
    return <div className="state-machine-screen__empty">ステートマシンがありません。右側で新しく作成できます。</div>;
  }
  if (layout === null || graph.nodes.length === 0) {
    return <div className="state-machine-screen__empty">状態がありません。左のパレットから状態を選んで追加してください。</div>;
  }
  return (
    <div className="state-machine-screen__viewport">
      <svg className="state-machine-screen__graph" role="group" aria-label={`${graph.name} の状態遷移図`}
        ref={viewport.ref} data-connecting={drag !== undefined} data-panning={viewport.panning}
        tabIndex={-1} onClick={clearOnBlankClick} onKeyDown={removeOnKeyDown} onPointerDown={viewport.startPan}
        viewBox={`${layout.width * (1 - 1 / view.zoom) / 2 + view.pan.x} ${layout.height * (1 - 1 / view.zoom) / 2 + view.pan.y} ${layout.width / view.zoom} ${layout.height / view.zoom}`}>
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
            onClick={() => view.selectElement({ kind: "edge", id: edge.id })}
            onKeyDown={(keyboard) => selectOnKeyDown(keyboard, { kind: "edge", id: edge.id })}>
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
          const handle = { x: point.x + StateMachineLayout.nodeSize.width / 2, y: point.y };
          const connectable = node.appearance !== "unresolved" && !node.appearance.includes("terminal");
          return <g key={node.id} className="state-machine-screen__node" data-status={node.status} data-node-id={node.id}
            data-selected={view.target.kind === "element" && view.target.selection.id === node.id}
            data-drop-target={drag?.over.some === true && drag.over.value === node.id && node.appearance !== "unresolved"}
            data-appearance={node.appearance} role="button" tabIndex={0} aria-label={`${node.name} ${node.appearance}`}
            onClick={() => view.selectElement({ kind: "node", id: node.id })}
            onKeyDown={(keyboard) => selectOnKeyDown(keyboard, { kind: "node", id: node.id })}>
            <rect x={point.x - StateMachineLayout.nodeSize.width / 2} y={point.y - StateMachineLayout.nodeSize.height / 2}
              width={StateMachineLayout.nodeSize.width} height={StateMachineLayout.nodeSize.height} rx="12" />
            <text x={point.x} y={point.y + 5} textAnchor="middle">{node.name}</text>
            {node.appearance.includes("initial") && <text x={point.x - StateMachineLayout.nodeSize.width / 2 + 15} y={point.y - 17} className="state-machine-screen__badge">●</text>}
            {node.appearance.includes("terminal") && <circle cx={point.x + StateMachineLayout.nodeSize.width / 2 - 18} cy={point.y - 17} r="7" fill="none" stroke="currentColor" strokeWidth="2" />}
            {connectable && <circle className="state-machine-screen__handle" cx={handle.x} cy={handle.y} r="7"
              aria-hidden="true" onPointerDown={(event) => connection.start(event, node.id, handle)} />}
          </g>;
        })}
        {drag !== undefined && <line className="state-machine-screen__connection" x1={drag.start.x} y1={drag.start.y}
          x2={drag.pointer.x} y2={drag.pointer.y} markerEnd={`url(#${arrowId})`} />}
      </svg>
    </div>
  );
}
