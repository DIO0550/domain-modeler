import type { UseStateMachineSelectionFormResult } from "../../hooks/use-state-machine-selection-form";
import { StateMachineForm } from "./form-fields";

type SelectionFieldsProps = Readonly<Pick<UseStateMachineSelectionFormResult, "fields" | "editable" | "changeField">>;

function Node({ fields, editable, changeField }: SelectionFieldsProps) {
  return <>
    <StateMachineForm.Input label="状態名" value={fields.name} disabled={!editable}
      onChange={(value) => changeField("name", value)} />
    <StateMachineForm.Checkbox label="初期状態" checked={fields.initial} disabled={!editable}
      onChange={(checked) => changeField("initial", checked)} />
    <StateMachineForm.Checkbox label="終端状態" checked={fields.terminal} disabled={!editable}
      onChange={(checked) => changeField("terminal", checked)} />
  </>;
}

function Edge({ fields, stateNames, changeField }: SelectionFieldsProps & Readonly<{ stateNames: readonly string[] }>) {
  return <>
    <StateMachineForm.Input label="イベント名" value={fields.event}
      onChange={(value) => changeField("event", value)} />
    <StateMachineForm.Select label="遷移元" value={fields.from} options={stateNames}
      onChange={(value) => changeField("from", value)} />
    <StateMachineForm.Select label="遷移先" value={fields.to} options={stateNames}
      onChange={(value) => changeField("to", value)} />
  </>;
}

/** 選択した状態または遷移に固有の入力欄。 */
export const StateMachineSelectionFields = { Node, Edge } as const;
