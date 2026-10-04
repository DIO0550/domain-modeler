import { StateMachineConnection } from "../../domains/state-machine-connection";
import type { useStateMachineCanvas } from "../../hooks/use-state-machine-canvas";
import type { UseStateMachineViewResult } from "../../hooks/use-state-machine-view";

/** 選択された非終端状態の四辺中央から接続を開始する。 */
export function StateMachineConnectionHandles({ view, canvas }: Readonly<{
  view: UseStateMachineViewResult;
  canvas: ReturnType<typeof useStateMachineCanvas>;
}>) {
  if (view.inspection?.kind !== "node" || view.resolution === null || canvas.layout === null) {
    return null;
  }
  const { node } = view.inspection;
  const center = canvas.layout.nodes[node.id];
  if (center === undefined || !StateMachineConnection.canStart(view.resolution, node.name)) {
    return null;
  }
  return Object.entries(StateMachineConnection.handles(center)).map(([side, point]) => (
    <circle key={side} cx={point.x} cy={point.y} r={7} role="button"
      aria-label={`${node.name} から接続 ${side}`} className="state-machine-screen__connection-handle"
      onPointerDown={(event) => canvas.begin(event, { kind: "connection", name: node.name, anchor: point })}
      onClick={(event) => event.stopPropagation()} />
  ));
}
