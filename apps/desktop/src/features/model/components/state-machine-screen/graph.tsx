import type { UseStateMachineViewResult } from "../../hooks/use-state-machine-view";
import { useStateMachineCanvas } from "../../hooks/use-state-machine-canvas";
import { StateMachineGraphDrawing } from "./graph-drawing";
import { useStateMachineContext } from "./context";

export function StateMachineGraphPanel() {
  const context = useStateMachineContext();
  if (!context.some) {
    return null;
  }
  const { view } = context.value;
  return <StateMachineCanvas key={`${view.selectedMachineIndex}-${view.graph?.name ?? "empty"}`} />;
}

function StateMachineCanvas() {
  const context = useStateMachineContext();
  if (!context.some) {
    return null;
  }
  return <StateMachineCanvasContents {...context.value} />;
}

function StateMachineCanvasContents({ view, value, onChange }: Readonly<{
  view: UseStateMachineViewResult;
  value: string;
  onChange: (source: string) => void;
}>) {
  const canvas = useStateMachineCanvas({ view, source: value, onChange });
  return (
    <section className="state-machine-screen__center" aria-label="ステートマシンのグラフ">
      <header className="state-machine-screen__toolbar">
        <label>ステートマシン
          <select value={view.selectedMachineIndex} disabled={view.analyzed.stateMachines.length === 0}
            onChange={(change) => view.selectMachine(Number(change.target.value))}>
            {view.analyzed.stateMachines.length === 0 && <option value={-1}>未作成</option>}
            {view.analyzed.stateMachines.map((machine, index) => (
              <option key={`${machine.machine.name}-${machine.machine.range.startLine}`} value={index}>{machine.machine.name}</option>
            ))}
          </select>
        </label>
        <div className="state-machine-screen__zoom" role="group" aria-label="グラフの倍率">
          <button type="button" disabled={view.graph === null || view.placementError !== ""} onClick={canvas.arrange}>自動整列</button>
          <button type="button" aria-label="縮小" disabled={view.graph === null} onClick={() => view.zoomBy(1 / 1.25)}>−</button>
          <button type="button" disabled={view.graph === null} onClick={canvas.fit}>フィット</button>
          <button type="button" aria-label="拡大" disabled={view.graph === null} onClick={() => view.zoomBy(1.25)}>＋</button>
        </div>
      </header>
      {canvas.error !== "" && <p role="alert" className="state-machine-screen__diagnostic">{canvas.error}</p>}
      {view.graph === null
        ? <div className="state-machine-screen__empty">ステートマシンがありません。右側で新しく作成できます。</div>
        : <StateMachineGraphDrawing view={view} canvas={canvas} />}
    </section>
  );
}
