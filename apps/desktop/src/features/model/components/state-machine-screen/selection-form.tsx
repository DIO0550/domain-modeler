import { useReducer, type FormEvent, type MouseEvent } from "react";
import { Result, type StateMachineResolution } from "@domain-modeler/model-core";
import { StateMachineGraph, type StateMachineGraphInspection, type StateMachineGraphSelection } from "../../domains/state-machine-graph";
import { StateMachineSource } from "../../domains/state-machine-source";

type Selection = Extract<StateMachineGraphInspection, { kind: "node" | "edge" }>;
type Props = Readonly<{
  inspection: Selection;
  resolution: StateMachineResolution;
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: StateMachineGraphSelection) => void;
  onClear: () => void;
}>;

type Draft = Readonly<{ name: string; initial: boolean; terminal: boolean; from: string; to: string; event: string; error: string }>;
type Action = Readonly<{ type: "field"; field: keyof Draft; value: string | boolean }> | Readonly<{ type: "error"; message: string }>;

const reduceDraft = (draft: Draft, action: Action): Draft => {
  if (action.type === "error") { return { ...draft, error: action.message }; }
  return { ...draft, [action.field]: action.value, error: "" };
};

const initialDraft = (inspection: Selection): Draft => {
  if (inspection.kind === "node") {
    return {
      name: inspection.node.name,
      initial: inspection.node.appearance.includes("initial"),
      terminal: inspection.node.appearance.includes("terminal"),
      from: "", to: "", event: "", error: "",
    };
  }
  return { name: "", initial: false, terminal: false,
    from: inspection.fromName, to: inspection.toName, event: inspection.edge.event, error: "" };
};

/** 選択した状態または遷移の編集を、確定時にDSLの1操作として適用する。 */
export function StateMachineSelectionForm({ inspection, resolution, value, onChange, onSelect, onClear }: Props) {
  const [draft, dispatch] = useReducer(reduceDraft, inspection, initialDraft);
  const editable = inspection.kind === "edge" || inspection.node.appearance !== "unresolved";
  const focusGraph = (form: HTMLFormElement, selected: boolean) => {
    const screen = form.closest<HTMLElement>(".state-machine-screen");
    requestAnimationFrame(() => {
      const target = selected ? screen?.querySelector<SVGElement>('[data-selected="true"]') : null;
      (target ?? screen?.querySelector<HTMLSelectElement>(".state-machine-screen__toolbar select"))?.focus();
    });
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editable) { return; }
    const result = inspection.kind === "node"
      ? StateMachineSource.updateState(value, resolution, { ...draft, oldName: inspection.node.name })
      : StateMachineSource.updateTransition(value, resolution, { ...draft, range: inspection.edge.range });
    if (Result.isErr(result)) { dispatch({ type: "error", message: result.error }); return; }
    onChange(result.value);
    onSelect(inspection.kind === "node" ? StateMachineGraph.stateSelection(draft.name) : StateMachineGraph.transitionSelection(draft));
    focusGraph(event.currentTarget, true);
  };
  const remove = (event: MouseEvent<HTMLButtonElement>) => {
    if (!editable) { return; }
    const target = inspection.kind === "node"
      ? { kind: "state" as const, name: inspection.node.name }
      : { kind: "transition" as const, range: inspection.edge.range };
    const result = StateMachineSource.remove(value, resolution, target);
    if (Result.isErr(result)) { dispatch({ type: "error", message: result.error }); return; }
    onChange(result.value);
    onClear();
    if (event.currentTarget.form !== null) { focusGraph(event.currentTarget.form, false); }
  };
  return <form onSubmit={submit}>
    {inspection.kind === "node" ? <>
      <label>状態名<input aria-label="状態名" value={draft.name} disabled={!editable}
        onChange={(event) => dispatch({ type: "field", field: "name", value: event.target.value })} /></label>
      <label className="state-machine-screen__checkbox"><input type="checkbox" checked={draft.initial} disabled={!editable}
        onChange={(event) => dispatch({ type: "field", field: "initial", value: event.target.checked })} />初期状態</label>
      <label className="state-machine-screen__checkbox"><input type="checkbox" checked={draft.terminal} disabled={!editable}
        onChange={(event) => dispatch({ type: "field", field: "terminal", value: event.target.checked })} />終端状態</label>
    </> : <>
      <label>イベント名<input aria-label="イベント名" value={draft.event}
        onChange={(event) => dispatch({ type: "field", field: "event", value: event.target.value })} /></label>
      <label>遷移元<select aria-label="遷移元" value={draft.from}
        onChange={(event) => dispatch({ type: "field", field: "from", value: event.target.value })}>
        {resolution.machine.states.map((state) => <option key={state.name} value={state.name}>{state.name}</option>)}
      </select></label>
      <label>遷移先<select aria-label="遷移先" value={draft.to}
        onChange={(event) => dispatch({ type: "field", field: "to", value: event.target.value })}>
        {resolution.machine.states.map((state) => <option key={state.name} value={state.name}>{state.name}</option>)}
      </select></label>
    </>}
    <button type="submit" disabled={!editable}>変更を反映</button>
    <button type="button" disabled={!editable} onClick={remove}>削除</button>
    {draft.error && <p role="alert" className="state-machine-screen__diagnostic">{draft.error}</p>}
  </form>;
}
