import type { FormEvent, MouseEvent } from "react";
import type { StateMachineResolution } from "@domain-modeler/model-core";
import type { StateMachineGraphInspection, StateMachineGraphSelection } from "../../domains/state-machine-graph";
import { useStateMachineSelectionForm } from "../../hooks/use-state-machine-selection-form";
import { StateMachineSelectionFields } from "./selection-fields";
import { focusGraph } from "./focus";

type Selection = Extract<StateMachineGraphInspection, { kind: "node" | "edge" }>;
type Props = Readonly<{
  inspection: Selection;
  resolution: StateMachineResolution;
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: StateMachineGraphSelection) => void;
  onClear: () => void;
}>;

/** 選択した状態または遷移の入力欄と操作を組み立てる。 */
export function StateMachineSelectionForm({ inspection, resolution, value, onChange, onSelect, onClear }: Props) {
  const editor = useStateMachineSelectionForm({ inspection, resolution, source: value, onChange, onSelect, onClear });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (editor.submit()) {
      focusGraph(form, true);
    }
  };
  const remove = (event: MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.form;
    if (editor.remove() && form !== null) {
      focusGraph(form, false);
    }
  };
  const fields = inspection.kind === "node"
    ? <StateMachineSelectionFields.Node {...editor} />
    : <StateMachineSelectionFields.Edge {...editor} stateNames={resolution.machine.states.map((state) => state.name)} />;
  return <form onSubmit={submit}>
    {fields}
    <button type="submit" disabled={!editor.editable}>変更を反映</button>
    <button type="button" disabled={!editor.editable} onClick={remove}>削除</button>
    {editor.error && <p role="alert" className="state-machine-screen__diagnostic">{editor.error}</p>}
  </form>;
}
