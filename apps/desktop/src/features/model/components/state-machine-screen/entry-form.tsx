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
}>;

/** 選択したパーツまたは新しいマシンの入力フォーム。 */
export function StateMachineEntryForm({ value, onChange, target }: StateMachineEntryFormProps) {
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
    return <StateMachineForm.Input label="マシン名" value={draft.fields.name}
      onChange={(value) => draft.changeField("name", value)} />;
  }
  if (target.part === "transition") {
    return <>
      <StateMachineForm.Input label="遷移元" value={draft.fields.from}
        onChange={(value) => draft.changeField("from", value)} />
      <StateMachineForm.Input label="遷移先" value={draft.fields.to}
        onChange={(value) => draft.changeField("to", value)} />
      <StateMachineForm.Input label="イベント名" value={draft.fields.event}
        onChange={(value) => draft.changeField("event", value)} />
    </>;
  }
  const label = target.part === "initial" ? "既存の状態名" : "状態名";
  return <StateMachineForm.Input label={label} value={draft.fields.name}
    onChange={(value) => draft.changeField("name", value)} />;
}
