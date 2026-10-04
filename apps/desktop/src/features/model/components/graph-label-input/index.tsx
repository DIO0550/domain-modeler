import { useReducer } from "react";
import { Result } from "@domain-modeler/model-core";
import type { StateMachinePosition } from "../../domains/state-machine-position";

type LabelDraft = Readonly<{ value: string; error: string }>;
type LabelAction = Readonly<{ kind: "change"; value: string }> | Readonly<{ kind: "error"; error: string }>;
const reduceLabel = (state: LabelDraft, action: LabelAction): LabelDraft => {
  if (action.kind === "change") {
    return { value: action.value, error: "" };
  }
  return { ...state, error: action.error };
};

/**
 * グラフのラベル付近で名前を入力し、明示的な確定または取消を通知する。
 * @param props 表示位置・初期値・入力名と確定／取消操作。
 * @returns SVG内に配置するラベル入力フォーム。
 */
export function GraphLabelInput({ point, label, initialValue = "", onSubmit, onCancel }: Readonly<{
  point: StateMachinePosition;
  label: string;
  initialValue?: string;
  onSubmit: (value: string) => Result<boolean, string>;
  onCancel: () => void;
}>) {
  const [draft, dispatch] = useReducer(reduceLabel, { value: initialValue, error: "" });
  return <foreignObject x={point.x - 130} y={point.y - 38} width={260} height={200}
    className="state-machine-screen__label-editor" onPointerDown={(event) => event.stopPropagation()}
    onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}
    onKeyDown={(event) => {
      event.stopPropagation();
      if (event.key === "Escape" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        onCancel();
      }
      if (event.key === "Enter" && event.nativeEvent.isComposing) {
        event.preventDefault();
      }
    }}>
    <form aria-label={label} onSubmit={(event) => {
      event.preventDefault();
      const result = onSubmit(draft.value);
      if (Result.isErr(result)) {
        dispatch({ kind: "error", error: result.error });
      }
    }}>
      <label>{label}<input autoFocus aria-label={label} value={draft.value}
        onChange={(event) => dispatch({ kind: "change", value: event.target.value })} /></label>
      <div><button type="submit">確定</button><button type="button" onClick={onCancel}>取消</button></div>
      {draft.error !== "" && <p role="alert">{draft.error}</p>}
    </form>
  </foreignObject>;
}
