import { GraphLabelInput } from "../graph-label-input";
import { StateMachineConnection } from "../../domains/state-machine-connection";
import { StateMachineLayout } from "../../domains/state-machine-layout";
import type { useStateMachineCanvas } from "../../hooks/use-state-machine-canvas";

/** 接続直後・状態名・既存イベント名の入力を共通部品で組み立てる。 */
export function StateMachineGraphLabelEditor({
  canvas,
}: Readonly<{ canvas: ReturnType<typeof useStateMachineCanvas> }>) {
  if (canvas.draft.some) {
    return (
      <GraphLabelInput
        point={StateMachineConnection.label(
          canvas.draft.value,
          canvas.viewport,
        )}
        label="新しい遷移のイベント名"
        onSubmit={canvas.submitConnection}
        onCancel={canvas.cancelLabel}
      />
    );
  }

  if (!canvas.labelEdit.some) {
    return null;
  }

  const edit = canvas.labelEdit.value;

  return (
    <GraphLabelInput
      key={edit.selection.id}
      point={StateMachineLayout.labelInputPosition(edit.point, canvas.viewport)}
      label={edit.kind === "state" ? "状態名を編集" : "イベント名を編集"}
      initialValue={edit.value}
      onSubmit={canvas.submitLabel}
      onCancel={canvas.cancelLabel}
    />
  );
}
