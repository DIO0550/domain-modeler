import { useId, type KeyboardEvent } from "react";
import type { StateMachinePart } from "../../domains/state-machine-source";
import { StateMachineLayout } from "../../domains/state-machine-layout";
import { useStateMachineView, type StateMachineSelection } from "../../hooks/use-state-machine-view";
import { useStateMachineDraft, type StateMachineDraftTarget } from "../../hooks/use-state-machine-draft";
import "./StateMachineScreen.css";

type StateMachineScreenProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
  onEditSource: () => void;
}>;

const PARTS: readonly Readonly<{ kind: StateMachinePart; label: string }>[] = [
  { kind: "state", label: "状態" },
  { kind: "initial", label: "初期" },
  { kind: "terminal", label: "終端" },
  { kind: "transition", label: "遷移" },
];

/**
 * `.dmodel` のステートマシンをパレット・グラフ・インスペクターで表示する。
 *
 * @param props 文書全文、変更通知、モデル定義画面への切替操作。
 * @returns ステートマシン全体の編集画面。
 */
export function StateMachineScreen({ value, onChange, onEditSource }: StateMachineScreenProps) {
  const arrowId = useId();
  const view = useStateMachineView(value);
  const { analyzed, graph, layout } = view;
  const part = view.target.kind === "part" ? view.target.part : null;
  const selection = view.target.kind === "element" ? view.target.selection : null;
  const resolution = analyzed.stateMachines[view.selectedMachineIndex];
  const selectedNode = graph?.nodes.find((node) => selection?.kind === "node" && node.id === selection.id);
  const selectedEdge = graph?.edges.find((edge) => selection?.kind === "edge" && edge.id === selection.id);
  const selectedDiagnostics = selectedNode?.diagnostics ?? selectedEdge?.diagnostics ?? graph?.diagnostics ?? [];
  const onElementKeyDown = (keyboard: KeyboardEvent<SVGGElement>, next: StateMachineSelection) => {
    if (keyboard.key !== "Enter" && keyboard.key !== " ") {
      return;
    }
    keyboard.preventDefault();
    view.selectElement(next);
  };

  return (
    <div className="state-machine-screen">
      <aside className="state-machine-screen__palette" aria-label="ステートマシンのパレット">
        <h2>パーツ</h2>
        {PARTS.map((item) => (
          <button key={item.kind} type="button" aria-pressed={part === item.kind} disabled={graph === null}
            onClick={() => view.selectPart(item.kind)}>{item.label}</button>
        ))}
        <p>パーツを選び、右側で内容を入力して追加します。</p>
      </aside>
      <section className="state-machine-screen__center" aria-label="ステートマシンのグラフ">
        <header className="state-machine-screen__toolbar">
          <label>ステートマシン
            <select value={graph === null ? "" : view.selectedMachineIndex} onChange={(change) => view.selectMachine(Number(change.target.value))} disabled={analyzed.stateMachines.length === 0}>
              {analyzed.stateMachines.length === 0 && <option value="">未作成</option>}
              {analyzed.stateMachines.map((machine, index) => (
                <option key={`${machine.machine.name}-${machine.machine.range.startLine}`} value={index}>{machine.machine.name}</option>
              ))}
            </select>
          </label>
          <div className="state-machine-screen__zoom" role="group" aria-label="グラフの倍率">
            <button type="button" aria-label="縮小" disabled={graph === null} onClick={() => view.zoomBy(1 / 1.25)}>−</button>
            <button type="button" disabled={graph === null} onClick={view.fit}>フィット</button>
            <button type="button" aria-label="拡大" disabled={graph === null} onClick={() => view.zoomBy(1.25)}>＋</button>
          </div>
        </header>
        {graph === null && <div className="state-machine-screen__empty">ステートマシンがありません。右側で新しく作成できます。</div>}
        {graph !== null && layout !== null && graph.nodes.length === 0 && <div className="state-machine-screen__empty">状態がありません。左のパレットから状態を選んで追加してください。</div>}
        {graph !== null && layout !== null && graph.nodes.length > 0 && (
          <div className="state-machine-screen__viewport">
            <svg className="state-machine-screen__graph" role="group" aria-label={`${graph.name} の状態遷移図`}
              viewBox={`${layout.width * (1 - 1 / view.zoom) / 2} ${layout.height * (1 - 1 / view.zoom) / 2} ${layout.width / view.zoom} ${layout.height / view.zoom}`}>
              <defs><marker id={arrowId} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M 0 0 L 9 4.5 L 0 9 Z" fill="var(--shell-muted)" /></marker></defs>
              {graph.edges.map((edge) => {
                const positioned = layout.edges.find((item) => item.id === edge.id);
                if (positioned === undefined) {
                  return null;
                }
                return <g key={edge.id} className="state-machine-screen__edge" data-status={edge.status} data-selected={selection?.id === edge.id}
                  tabIndex={0} role="button" aria-label={`${graph.nodes.find((node) => node.id === edge.from)?.name ?? "?"} から ${graph.nodes.find((node) => node.id === edge.to)?.name ?? "?"} へ、${edge.event}`} onClick={() => view.selectElement({ kind: "edge", id: edge.id })}
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
                  onClick={() => view.selectElement({ kind: "node", id: node.id })}
                  onKeyDown={(keyboard) => onElementKeyDown(keyboard, { kind: "node", id: node.id })}>
                  <rect x={point.x - StateMachineLayout.nodeSize.width / 2} y={point.y - StateMachineLayout.nodeSize.height / 2} width={StateMachineLayout.nodeSize.width} height={StateMachineLayout.nodeSize.height} rx="12" />
                  <text x={point.x} y={point.y + 5} textAnchor="middle">{node.name}</text>
                  {node.appearance.includes("initial") && <text x={point.x - StateMachineLayout.nodeSize.width / 2 + 15} y={point.y - 17} className="state-machine-screen__badge">●</text>}
                  {node.appearance.includes("terminal") && <circle cx={point.x + StateMachineLayout.nodeSize.width / 2 - 18} cy={point.y - 17} r="7" fill="none" stroke="currentColor" strokeWidth="2" />}
                </g>;
              })}
            </svg>
          </div>
        )}
      </section>
      <aside className="state-machine-screen__inspector" aria-label="ステートマシンのインスペクター">
        <h2>{part === null ? "インスペクター" : `${PARTS.find((item) => item.kind === part)?.label}を追加`}</h2>
        {graph === null && <StateMachineEntryForm key="machine" value={value} onChange={onChange} target={{ kind: "machine" }} />}
        {graph !== null && part !== null && resolution !== undefined && (
          <StateMachineEntryForm key={`${view.selectedMachineIndex}-${part}`} value={value} onChange={onChange}
            target={{ kind: "part", part, resolution }} />
        )}
        {graph !== null && part === null && <div className="state-machine-screen__details">
          <strong>{selectedNode?.name ?? selectedEdge?.event ?? graph.name}</strong>
          {selectedNode !== undefined && <p>状態 · {selectedNode.appearance}</p>}
          {selectedEdge !== undefined && <p>{graph.nodes.find((node) => node.id === selectedEdge.from)?.name ?? "?"} → {graph.nodes.find((node) => node.id === selectedEdge.to)?.name ?? "?"}</p>}
          {selection === null && <p>状態または遷移を選択すると詳細が表示されます。</p>}
          {selectedDiagnostics.map((diagnostic, index) => <p key={`${diagnostic.message}-${index}`} className="state-machine-screen__diagnostic">{diagnostic.message}</p>)}
        </div>}
        <button type="button" className="state-machine-screen__source" onClick={onEditSource}>モデル定義で編集</button>
      </aside>
    </div>
  );
}


type StateMachineEntryFormProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
  target: StateMachineDraftTarget;
}>;

/** 選択したパーツまたは新しいマシンの入力フォーム。 */
function StateMachineEntryForm({ value, onChange, target }: StateMachineEntryFormProps) {
  const draft = useStateMachineDraft({ source: value, onChange, target });
  const part = target.kind === "part" ? target.part : null;
  const nameLabel = part === "initial" ? "既存の状態名" : "状態名";
  return (
    <form onSubmit={(submit) => { submit.preventDefault(); draft.submit(); }}>
      {target.kind === "machine" && (
        <label>マシン名<input aria-label="マシン名" value={draft.fields.name}
          onChange={(change) => draft.changeField("name", change.target.value)} /></label>
      )}
      {part === "transition" && <>
        <label>遷移元<input aria-label="遷移元" value={draft.fields.from}
          onChange={(change) => draft.changeField("from", change.target.value)} /></label>
        <label>遷移先<input aria-label="遷移先" value={draft.fields.to}
          onChange={(change) => draft.changeField("to", change.target.value)} /></label>
        <label>イベント名<input aria-label="イベント名" value={draft.fields.event}
          onChange={(change) => draft.changeField("event", change.target.value)} /></label>
      </>}
      {part !== null && part !== "transition" && (
        <label>{nameLabel}<input aria-label={nameLabel} value={draft.fields.name}
          onChange={(change) => draft.changeField("name", change.target.value)} /></label>
      )}
      <button type="submit">{target.kind === "machine" ? "マシンを作成" : "追加"}</button>
      {draft.error && <p role="alert" className="state-machine-screen__diagnostic">{draft.error}</p>}
    </form>
  );
}
