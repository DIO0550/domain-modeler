import type { StateMachinePart } from "../../domains/state-machine-source";
import { useStateMachineContext } from "./context";
import { PART_LABELS } from "./part-labels";

export function StateMachinePalette() {
  const context = useStateMachineContext();
  if (!context.some) {
    return null;
  }
  const { view } = context.value;
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
