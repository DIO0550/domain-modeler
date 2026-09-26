import type { ReactNode } from "react";
import type { StateMachineGraphInspection } from "../../domains/state-machine-graph";
import { useStateMachineContext } from "./context";
import { StateMachineEntryForm } from "./entry-form";
import { PART_LABELS } from "./part-labels";

export function StateMachineInspector() {
  const context = useStateMachineContext();
  if (!context.some) {
    return null;
  }
  const { view, onEditSource } = context.value;
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
  const context = useStateMachineContext();
  if (!context.some) {
    return null;
  }
  const { view, value, onChange } = context.value;
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
