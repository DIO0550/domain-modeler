import { useId, type KeyboardEvent } from "react";
import {
  StateMachineGraph,
  type StateMachineGraphSelection,
} from "../../domains/state-machine-graph";
import { StateMachineLayout } from "../../domains/state-machine-layout";
import { useStateMachineContext } from "./context";

export function StateMachineGraphPanel() {
  const { view } = useStateMachineContext();
  return (
    <section className="state-machine-screen__center" aria-label="ステートマシンのグラフ">
      <header className="state-machine-screen__toolbar">
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
        <div className="state-machine-screen__zoom" role="group" aria-label="グラフの倍率">
          <button type="button" aria-label="縮小" disabled={view.graph === null} onClick={() => view.zoomBy(1 / 1.25)}>−</button>
          <button type="button" disabled={view.graph === null} onClick={view.fit}>フィット</button>
          <button type="button" aria-label="拡大" disabled={view.graph === null} onClick={() => view.zoomBy(1.25)}>＋</button>
        </div>
      </header>
      <StateMachineGraphContent />
    </section>
  );
}

function StateMachineGraphContent() {
  const { view } = useStateMachineContext();
  const arrowId = useId();
  const { graph, layout } = view;
  const selectOnKeyDown = (keyboard: KeyboardEvent<SVGGElement>, selection: StateMachineGraphSelection) => {
    if (keyboard.key !== "Enter" && keyboard.key !== " ") {
      return;
    }
    keyboard.preventDefault();
    view.selectElement(selection);
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
        viewBox={`${layout.width * (1 - 1 / view.zoom) / 2} ${layout.height * (1 - 1 / view.zoom) / 2} ${layout.width / view.zoom} ${layout.height / view.zoom}`}>
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
          return <g key={node.id} className="state-machine-screen__node" data-status={node.status}
            data-selected={view.target.kind === "element" && view.target.selection.id === node.id}
            data-appearance={node.appearance} role="button" tabIndex={0} aria-label={`${node.name} ${node.appearance}`}
            onClick={() => view.selectElement({ kind: "node", id: node.id })}
            onKeyDown={(keyboard) => selectOnKeyDown(keyboard, { kind: "node", id: node.id })}>
            <rect x={point.x - StateMachineLayout.nodeSize.width / 2} y={point.y - StateMachineLayout.nodeSize.height / 2}
              width={StateMachineLayout.nodeSize.width} height={StateMachineLayout.nodeSize.height} rx="12" />
            <text x={point.x} y={point.y + 5} textAnchor="middle">{node.name}</text>
            {node.appearance.includes("initial") && <text x={point.x - StateMachineLayout.nodeSize.width / 2 + 15} y={point.y - 17} className="state-machine-screen__badge">●</text>}
            {node.appearance.includes("terminal") && <circle cx={point.x + StateMachineLayout.nodeSize.width / 2 - 18} cy={point.y - 17} r="7" fill="none" stroke="currentColor" strokeWidth="2" />}
          </g>;
        })}
      </svg>
    </div>
  );
}
