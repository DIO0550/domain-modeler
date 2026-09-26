import { createContext, useContext, useId, type KeyboardEvent, type ReactNode } from "react";
import {
  StateMachineGraph,
  type StateMachineGraphInspection,
  type StateMachineGraphSelection,
} from "../../domains/state-machine-graph";
import { StateMachineLayout } from "../../domains/state-machine-layout";
import type { StateMachinePart } from "../../domains/state-machine-source";
import {
  useStateMachineDraft,
  type StateMachineDraftTarget,
  type UseStateMachineDraftResult,
} from "../../hooks/use-state-machine-draft";
import {
  useStateMachineView,
  type UseStateMachineViewResult,
} from "../../hooks/use-state-machine-view";
import "./StateMachineScreen.css";

type StateMachineRootProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
  onEditSource: () => void;
  children: ReactNode;
}>;

type StateMachineContextValue = Readonly<{
  view: UseStateMachineViewResult;
  value: string;
  onChange: (text: string) => void;
  onEditSource: () => void;
}>;

const StateMachineContext = createContext<StateMachineContextValue | null>(null);

function useStateMachineContext(): StateMachineContextValue {
  const context = useContext(StateMachineContext);
  if (context === null) {
    throw new Error("StateMachine の子コンポーネントは StateMachine.Root の内側で使用してください");
  }
  return context;
}

const PART_LABELS: Readonly<Record<StateMachinePart, string>> = {
  state: "状態",
  initial: "初期",
  terminal: "終端",
  transition: "遷移",
};

/**
 * `.dmodel` のステートマシンをパレット・グラフ・インスペクターで表示する。
 *
 * @param props 文書全文、変更通知、モデル定義画面への切替操作、配置する子要素。
 * @returns ステートマシン全体の編集画面。
 */
function StateMachineRoot({ value, onChange, onEditSource, children }: StateMachineRootProps) {
  const view = useStateMachineView(value);
  return (
    <StateMachineContext.Provider value={{ view, value, onChange, onEditSource }}>
      <div className="state-machine-screen">{children}</div>
    </StateMachineContext.Provider>
  );
}

function StateMachinePalette() {
  const { view } = useStateMachineContext();
  const parts = Object.entries(PART_LABELS) as [StateMachinePart, string][];
  return (
    <aside className="state-machine-screen__palette" aria-label="ステートマシンのパレット">
      <h2>パーツ</h2>
      {parts.map(([part, label]) => (
        <button key={part} type="button" disabled={view.graph === null}
          aria-pressed={view.target.kind === "part" && view.target.part === part}
          onClick={() => view.selectPart(part)}>{label}</button>
      ))}
      <p>パーツを選び、右側で内容を入力して追加します。</p>
    </aside>
  );
}

function StateMachineGraphPanel() {
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

function StateMachineInspector() {
  const { view, onEditSource } = useStateMachineContext();
  let heading = "インスペクター";
  if (view.target.kind === "part") {
    heading = `${PART_LABELS[view.target.part]}を追加`;
  }
  return (
    <aside className="state-machine-screen__inspector" aria-label="ステートマシンのインスペクター">
      <h2>{heading}</h2>
      <StateMachineInspectorContent />
      <button type="button" className="state-machine-screen__source" onClick={onEditSource}>モデル定義で編集</button>
    </aside>
  );
}

function StateMachineInspectorContent() {
  const { view, value, onChange } = useStateMachineContext();
  if (view.graph === null) {
    return <StateMachineEntryForm key="machine" value={value} onChange={onChange} target={{ kind: "machine" }} />;
  }
  if (view.target.kind === "part" && view.resolution !== null) {
    return <StateMachineEntryForm key={`${view.selectedMachineIndex}-${view.target.part}`}
      value={value} onChange={onChange}
      target={{ kind: "part", part: view.target.part, resolution: view.resolution }} />;
  }
  if (view.inspection === null) {
    return null;
  }
  return <StateMachineInspectionDetails inspection={view.inspection} />;
}

function StateMachineInspectionDetails({ inspection }: Readonly<{ inspection: StateMachineGraphInspection }>) {
  let title: string;
  let detail: ReactNode = null;
  switch (inspection.kind) {
    case "node":
      title = inspection.node.name;
      detail = <p>状態 · {inspection.node.appearance}</p>;
      break;
    case "edge":
      title = inspection.edge.event;
      detail = <p>{inspection.fromName} → {inspection.toName}</p>;
      break;
    case "machine":
      title = inspection.name;
      detail = <p>状態または遷移を選択すると詳細が表示されます。</p>;
      break;
  }
  return <div className="state-machine-screen__details">
    <strong>{title}</strong>
    {detail}
    {inspection.diagnostics.map((diagnostic, index) =>
      <p key={`${diagnostic.message}-${index}`} className="state-machine-screen__diagnostic">{diagnostic.message}</p>
    )}
  </div>;
}

type StateMachineEntryFormProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
  target: StateMachineDraftTarget;
}>;

/** 選択したパーツまたは新しいマシンの入力フォーム。 */
function StateMachineEntryForm({ value, onChange, target }: StateMachineEntryFormProps) {
  const draft = useStateMachineDraft({ source: value, onChange, target });
  return <form onSubmit={(submit) => { submit.preventDefault(); draft.submit(); }}>
    <StateMachineEntryFields target={target} draft={draft} />
    <button type="submit">{target.kind === "machine" ? "マシンを作成" : "追加"}</button>
    {draft.error && <p role="alert" className="state-machine-screen__diagnostic">{draft.error}</p>}
  </form>;
}

function StateMachineEntryFields({ target, draft }: Readonly<{
  target: StateMachineDraftTarget;
  draft: UseStateMachineDraftResult;
}>) {
  if (target.kind === "machine") {
    return <label>マシン名<input aria-label="マシン名" value={draft.fields.name}
      onChange={(change) => draft.changeField("name", change.target.value)} /></label>;
  }
  if (target.part === "transition") {
    return <>
      <label>遷移元<input aria-label="遷移元" value={draft.fields.from}
        onChange={(change) => draft.changeField("from", change.target.value)} /></label>
      <label>遷移先<input aria-label="遷移先" value={draft.fields.to}
        onChange={(change) => draft.changeField("to", change.target.value)} /></label>
      <label>イベント名<input aria-label="イベント名" value={draft.fields.event}
        onChange={(change) => draft.changeField("event", change.target.value)} /></label>
    </>;
  }
  const label = target.part === "initial" ? "既存の状態名" : "状態名";
  return <label>{label}<input aria-label={label} value={draft.fields.name}
    onChange={(change) => draft.changeField("name", change.target.value)} /></label>;
}

/** 画面状態を共有するステートマシンの構成要素。 */
export const StateMachine = {
  Root: StateMachineRoot,
  Palette: StateMachinePalette,
  Graph: StateMachineGraphPanel,
  Inspector: StateMachineInspector,
} as const;
