import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { Result } from "@domain-modeler/model-core";
import { AnalyzedModel } from "../../domains/analyzed-model";
import { StateMachineGraph } from "../../domains/state-machine-graph";
import { StateMachineLayout } from "../../domains/state-machine-layout";
import { StateMachineSource, type StateMachinePart } from "../../domains/state-machine-source";
import "./StateMachineScreen.css";

type StateMachineScreenProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
  onEditSource: () => void;
}>;

type Selection = Readonly<{ kind: "node" | "edge"; id: string }>;

const PARTS: readonly Readonly<{ kind: StateMachinePart; label: string }>[] = [
  { kind: "state", label: "状態" },
  { kind: "initial", label: "初期" },
  { kind: "terminal", label: "終端" },
  { kind: "transition", label: "遷移" },
];

/** State-machine workspace using the same .dmodel value as the model editor. */
export function StateMachineScreen({ value, onChange, onEditSource }: StateMachineScreenProps) {
  const arrowId = useId();
  const [machineIndex, setMachineIndex] = useState(0);
  const [part, setPart] = useState<StateMachinePart | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [event, setEvent] = useState("");
  const analyzed = AnalyzedModel.create(value);
  const selectedMachineIndex = Math.min(machineIndex, analyzed.stateMachines.length - 1);
  const resolution = analyzed.stateMachines[selectedMachineIndex];
  const graph = resolution === undefined ? null : StateMachineGraph.create(resolution, analyzed.diagnostics);
  const layout = graph === null ? null : StateMachineLayout.create(graph);
  const selectedNode = graph?.nodes.find((node) => selection?.kind === "node" && node.id === selection.id);
  const selectedEdge = graph?.edges.find((edge) => selection?.kind === "edge" && edge.id === selection.id);
  const selectedDiagnostics = selectedNode?.diagnostics ?? selectedEdge?.diagnostics ?? graph?.diagnostics ?? [];

  const addMachine = (submit: FormEvent<HTMLFormElement>) => {
    submit.preventDefault();
    const result = StateMachineSource.create(value, name);
    if (Result.isErr(result)) {
      setError(result.error);
      return;
    }
    onChange(result.value);
    setError("");
    setName("");
  };
  const addPart = (submit: FormEvent<HTMLFormElement>) => {
    submit.preventDefault();
    if (resolution === undefined || part === null) {
      return;
    }
    const result = StateMachineSource.add(value, resolution, { part, name, from, to, event });
    if (Result.isErr(result)) {
      setError(result.error);
      return;
    }
    onChange(result.value);
    setError("");
    setName("");
    setEvent("");
  };
  const selectPart = (next: StateMachinePart) => {
    setPart(next);
    setSelection(null);
    setError("");
  };
  const selectElement = (next: Selection) => {
    setSelection(next);
    setPart(null);
    setError("");
  };
  const onElementKeyDown = (keyboard: KeyboardEvent<SVGGElement>, next: Selection) => {
    if (keyboard.key !== "Enter" && keyboard.key !== " ") {
      return;
    }
    keyboard.preventDefault();
    selectElement(next);
  };

  return (
    <div className="state-machine-screen">
      <aside className="state-machine-screen__palette" aria-label="ステートマシンのパレット">
        <h2>パーツ</h2>
        {PARTS.map((item) => (
          <button key={item.kind} type="button" aria-pressed={part === item.kind} disabled={graph === null}
            onClick={() => selectPart(item.kind)}>{item.label}</button>
        ))}
        <p>パーツを選び、右側で内容を入力して追加します。</p>
      </aside>
      <section className="state-machine-screen__center" aria-label="ステートマシンのグラフ">
        <header className="state-machine-screen__toolbar">
          <label>ステートマシン
            <select value={resolution === undefined ? "" : selectedMachineIndex} onChange={(change) => {
              setMachineIndex(Number(change.target.value));
              setSelection(null);
              setPart(null);
              setZoom(1);
            }} disabled={analyzed.stateMachines.length === 0}>
              {analyzed.stateMachines.length === 0 && <option value="">未作成</option>}
              {analyzed.stateMachines.map((machine, index) => (
                <option key={`${machine.machine.name}-${machine.machine.range.startLine}`} value={index}>{machine.machine.name}</option>
              ))}
            </select>
          </label>
          <div className="state-machine-screen__zoom" role="group" aria-label="グラフの倍率">
            <button type="button" aria-label="縮小" disabled={graph === null} onClick={() => setZoom((current) => Math.max(0.5, current / 1.25))}>−</button>
            <button type="button" disabled={graph === null} onClick={() => setZoom(1)}>フィット</button>
            <button type="button" aria-label="拡大" disabled={graph === null} onClick={() => setZoom((current) => Math.min(3, current * 1.25))}>＋</button>
          </div>
        </header>
        {graph === null && <div className="state-machine-screen__empty">ステートマシンがありません。右側で新しく作成できます。</div>}
        {graph !== null && layout !== null && graph.nodes.length === 0 && <div className="state-machine-screen__empty">状態がありません。左のパレットから状態を選んで追加してください。</div>}
        {graph !== null && layout !== null && graph.nodes.length > 0 && (
          <div className="state-machine-screen__viewport">
            <svg className="state-machine-screen__graph" role="group" aria-label={`${graph.name} の状態遷移図`}
              viewBox={`${layout.width * (1 - 1 / zoom) / 2} ${layout.height * (1 - 1 / zoom) / 2} ${layout.width / zoom} ${layout.height / zoom}`}>
              <defs><marker id={arrowId} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M 0 0 L 9 4.5 L 0 9 Z" fill="var(--shell-muted)" /></marker></defs>
              {graph.edges.map((edge) => {
                const positioned = layout.edges.find((item) => item.id === edge.id);
                if (positioned === undefined) {
                  return null;
                }
                return <g key={edge.id} className="state-machine-screen__edge" data-status={edge.status} data-selected={selection?.id === edge.id}
                  tabIndex={0} role="button" aria-label={`${graph.nodes.find((node) => node.id === edge.from)?.name ?? "?"} から ${graph.nodes.find((node) => node.id === edge.to)?.name ?? "?"} へ、${edge.event}`} onClick={() => selectElement({ kind: "edge", id: edge.id })}
                  onKeyDown={(keyboard) => onElementKeyDown(keyboard, { kind: "edge", id: edge.id })}>
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
                return <g key={node.id} className="state-machine-screen__node" data-status={node.status} data-selected={selection?.id === node.id}
                  data-appearance={node.appearance} role="button" tabIndex={0} aria-label={`${node.name} ${node.appearance}`}
                  onClick={() => selectElement({ kind: "node", id: node.id })}
                  onKeyDown={(keyboard) => onElementKeyDown(keyboard, { kind: "node", id: node.id })}>
                  <rect x={point.x - 80} y={point.y - 32} width="160" height="64" rx="12" />
                  <text x={point.x} y={point.y + 5} textAnchor="middle">{node.name}</text>
                  {node.appearance.includes("initial") && <text x={point.x - 65} y={point.y - 17} className="state-machine-screen__badge">●</text>}
                  {node.appearance.includes("terminal") && <circle cx={point.x + 62} cy={point.y - 17} r="7" fill="none" stroke="currentColor" strokeWidth="2" />}
                </g>;
              })}
            </svg>
          </div>
        )}
      </section>
      <aside className="state-machine-screen__inspector" aria-label="ステートマシンのインスペクター">
        <h2>{part === null ? "インスペクター" : `${PARTS.find((item) => item.kind === part)?.label}を追加`}</h2>
        {graph === null && <form onSubmit={addMachine}>
          <label>マシン名<input aria-label="マシン名" value={name} onChange={(change) => setName(change.target.value)} /></label>
          <button type="submit">マシンを作成</button>
        </form>}
        {graph !== null && part !== null && <form onSubmit={addPart}>
          {part === "transition" ? <>
            <label>遷移元<input aria-label="遷移元" value={from} onChange={(change) => setFrom(change.target.value)} /></label>
            <label>遷移先<input aria-label="遷移先" value={to} onChange={(change) => setTo(change.target.value)} /></label>
            <label>イベント名<input aria-label="イベント名" value={event} onChange={(change) => setEvent(change.target.value)} /></label>
          </> : <label>{part === "initial" ? "既存の状態名" : "状態名"}<input aria-label="状態名" value={name} onChange={(change) => setName(change.target.value)} /></label>}
          <button type="submit">追加</button>
        </form>}
        {graph !== null && part === null && <div className="state-machine-screen__details">
          <strong>{selectedNode?.name ?? selectedEdge?.event ?? graph.name}</strong>
          {selectedNode !== undefined && <p>状態 · {selectedNode.appearance}</p>}
          {selectedEdge !== undefined && <p>{graph.nodes.find((node) => node.id === selectedEdge.from)?.name ?? "?"} → {graph.nodes.find((node) => node.id === selectedEdge.to)?.name ?? "?"}</p>}
          {selection === null && <p>状態または遷移を選択すると詳細が表示されます。</p>}
          {selectedDiagnostics.map((diagnostic, index) => <p key={`${diagnostic.message}-${index}`} className="state-machine-screen__diagnostic">{diagnostic.message}</p>)}
        </div>}
        {error && <p role="alert" className="state-machine-screen__diagnostic">{error}</p>}
        <button type="button" className="state-machine-screen__source" onClick={onEditSource}>モデル定義で編集</button>
      </aside>
    </div>
  );
}
