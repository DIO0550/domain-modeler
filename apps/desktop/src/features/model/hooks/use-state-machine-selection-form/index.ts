import { useReducer } from "react";
import { Result, type StateMachineResolution } from "@domain-modeler/model-core";
import { StateMachineGraph, type StateMachineGraphInspection, type StateMachineGraphSelection } from "../../domains/state-machine-graph";
import { StateMachineSource, type StateMachineStateInput, type StateMachineTransitionInput } from "../../domains/state-machine-source";

type Selection = Extract<StateMachineGraphInspection, { kind: "node" | "edge" }>;
type SelectionFields = Readonly<StateMachineStateInput & StateMachineTransitionInput>;
type Draft = Readonly<{ fields: SelectionFields; error: string }>;
type Action = Readonly<{ type: "field"; field: keyof SelectionFields; value: string | boolean }> | Readonly<{ type: "error"; message: string }>;

const reduceDraft = (draft: Draft, action: Action): Draft => {
  if (action.type === "error") { return { ...draft, error: action.message }; }
  return { fields: { ...draft.fields, [action.field]: action.value }, error: "" };
};

const initialDraft = (inspection: Selection): Draft => {
  if (inspection.kind === "node") {
    return { fields: {
      name: inspection.node.name,
      initial: inspection.node.appearance.includes("initial"),
      terminal: inspection.node.appearance.includes("terminal"),
      from: "", to: "", event: "",
    }, error: "" };
  }
  return { fields: { name: "", initial: false, terminal: false,
    from: inspection.fromName, to: inspection.toName, event: inspection.edge.event }, error: "" };
};

export type UseStateMachineSelectionFormParams = Readonly<{
  inspection: Selection;
  resolution: StateMachineResolution;
  source: string;
  onChange: (source: string) => void;
  onSelect: (selection: StateMachineGraphSelection) => void;
  onClear: () => void;
}>;

export type UseStateMachineSelectionFormResult = Readonly<{
  fields: SelectionFields;
  error: string;
  editable: boolean;
  changeField: <K extends keyof SelectionFields>(field: K, value: SelectionFields[K]) => void;
  submit: () => boolean;
  remove: () => boolean;
}>;

/** 選択中の状態・遷移の下書きと、DSLの更新結果を管理する。 */
export function useStateMachineSelectionForm({ inspection, resolution, source, onChange, onSelect, onClear }: UseStateMachineSelectionFormParams): UseStateMachineSelectionFormResult {
  const [draft, dispatch] = useReducer(reduceDraft, inspection, initialDraft);
  const editable = inspection.kind === "edge" || inspection.node.appearance !== "unresolved";
  const submit = (): boolean => {
    if (!editable) { return false; }
    const result = inspection.kind === "node"
      ? StateMachineSource.updateState(source, resolution, { ...draft.fields, oldName: inspection.node.name })
      : StateMachineSource.updateTransition(source, resolution, { ...draft.fields, range: inspection.edge.range });
    if (Result.isErr(result)) { dispatch({ type: "error", message: result.error }); return false; }
    onChange(result.value);
    onSelect(inspection.kind === "node" ? StateMachineGraph.stateSelection(draft.fields.name) : StateMachineGraph.transitionSelection(draft.fields));
    return true;
  };
  const remove = (): boolean => {
    if (!editable) { return false; }
    const target = inspection.kind === "node"
      ? { kind: "state" as const, name: inspection.node.name }
      : { kind: "transition" as const, range: inspection.edge.range };
    const result = StateMachineSource.remove(source, resolution, target);
    if (Result.isErr(result)) { dispatch({ type: "error", message: result.error }); return false; }
    onChange(result.value);
    onClear();
    return true;
  };
  return {
    fields: draft.fields,
    error: draft.error,
    editable,
    changeField: (field, value) => dispatch({ type: "field", field, value }),
    submit,
    remove,
  };
}
