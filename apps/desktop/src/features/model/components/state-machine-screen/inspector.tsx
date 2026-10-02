import type { ReactNode } from "react";
import { StateMachineGraph, type StateMachineGraphInspection } from "../../domains/state-machine-graph";
import type { SourceRange } from "@domain-modeler/model-core";
import type { StateMachineDraftTarget } from "../../hooks/use-state-machine-draft";
import { useStateMachineContext } from "./context";
import { StateMachineEntryForm } from "./entry-form";
import { PART_LABELS } from "./part-labels";
import { StateMachineSelectionForm } from "./selection-form";

export function StateMachineInspector() {
  const context = useStateMachineContext();
  if (!context.some) {
    return null;
  }
  const { view, onEditSource } = context.value;
  const { graph, inspection } = view;
  let heading = "インスペクター";
  if (view.target.kind === "part") {
    heading = `${PART_LABELS[view.target.part]}を追加`;
  }
  return (
    <aside className="state-machine-screen__inspector" aria-label="ステートマシンのインスペクター">
      <h2>{heading}</h2>
      <StateMachineInspectorContent />
      <div className="state-machine-screen__navigation">
        <button type="button" className="state-machine-screen__source" onClick={() => onEditSource(graph?.nameRange)}>
          {graph === null ? "モデルに戻る" : "モデルで開く"}
        </button>
        <StateMachineSourceJump graph={graph} inspection={inspection} onEditSource={onEditSource} />
      </div>
    </aside>
  );
}

function StateMachineSourceJump({ graph, inspection, onEditSource }: Readonly<{
  graph: StateMachineGraph | null;
  inspection: StateMachineGraphInspection | null;
  onEditSource: (range?: SourceRange) => void;
}>) {
  if (graph === null) {
    return null;
  }
  if (inspection === null) {
    return null;
  }
  if (inspection.kind === "machine") {
    return null;
  }
  return <button type="button" onClick={() => onEditSource(StateMachineGraph.sourceRange(graph, inspection))}>
    選択要素の DSL へ移動
  </button>;
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
    const { part } = view.target;
    const target: StateMachineDraftTarget = part === "transition"
      ? { kind: "part", part, resolution: view.resolution, origin: view.origin }
      : { kind: "part", part, resolution: view.resolution };
    const origin = view.origin.some ? view.origin.value : "";
    return <StateMachineEntryForm key={`${view.selectedMachineIndex}-${part}-${origin}`}
      value={value} onChange={onChange} target={target} />;
  }
  if (view.inspection === null) {
    return null;
  }
  return <>
    {view.inspection.kind !== "machine" && view.resolution !== null &&
      <StateMachineSelectionForm key={`${view.selectedMachineIndex}-${view.target.kind === "element" ? view.target.selection.id : "none"}-${value}`}
        inspection={view.inspection} resolution={view.resolution} value={value} onChange={onChange}
        onSelect={view.selectElement} onClear={view.clearSelection} />}
    <StateMachineInspectionDetails inspection={view.inspection} />
  </>;
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
