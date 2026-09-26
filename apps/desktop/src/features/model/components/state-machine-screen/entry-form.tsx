import {
  useStateMachineDraft,
  type StateMachineDraftTarget,
  type UseStateMachineDraftResult,
} from "../../hooks/use-state-machine-draft";

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
