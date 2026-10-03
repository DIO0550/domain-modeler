import type { Option } from "@/utils/Option";
import {
  useStateMachineDraft,
  type StateMachineDraftTarget,
  type UseStateMachineDraftResult,
} from "../../hooks/use-state-machine-draft";
import { StateMachineForm } from "./form-fields";

type StateMachineEntryFormProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
  target: StateMachineDraftTarget;
  initialFrom?: Option<string>;
}>;

/** 選択したパーツまたは新しいマシンの入力フォーム。 */
export function StateMachineEntryForm({ value, onChange, target, initialFrom }: StateMachineEntryFormProps) {
  const draft = useStateMachineDraft({ source: value, onChange, target, initialFrom });
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
    return <StateMachineForm.Input label="マシン名" value={draft.fields.name}
      onChange={(value) => draft.changeField("name", value)} />;
  }
  if (target.part === "transition") {
    return <>
      <StateMachineForm.Select label="遷移元" value={draft.fields.from} options={draft.transitionChoices.from}
        onChange={(value) => draft.changeField("from", value)} />
      <StateMachineForm.Select label="遷移先" value={draft.fields.to} options={draft.transitionChoices.to}
        onChange={(value) => draft.changeField("to", value)} />
      <StateMachineForm.Input label="イベント名" value={draft.fields.event}
        onChange={(value) => draft.changeField("event", value)} />
    </>;
  }
  return <>
    <StateMachineForm.Input label="状態名" value={draft.fields.name}
      onChange={(value) => draft.changeField("name", value)} />
    <StateMachineForm.Checkbox label="初期状態" checked={draft.fields.initial}
      onChange={(checked) => draft.changeField("initial", checked)} />
    <StateMachineForm.Checkbox label="終端状態" checked={draft.fields.terminal}
      onChange={(checked) => draft.changeField("terminal", checked)} />
  </>;
}
