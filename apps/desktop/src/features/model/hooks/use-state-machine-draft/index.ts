import { useReducer } from "react";
import { Result, type StateMachineResolution } from "@domain-modeler/model-core";
import {
  StateMachineSource,
  type StateMachinePart,
  type StateMachineSourceInput,
} from "../../domains/state-machine-source";

export type StateMachineDraftTarget =
  | Readonly<{ kind: "machine" }>
  | Readonly<{ kind: "part"; part: StateMachinePart; resolution: StateMachineResolution }>;

type UseStateMachineDraftParams = Readonly<{
  source: string;
  onChange: (text: string) => void;
  target: StateMachineDraftTarget;
}>;

type DraftState = Readonly<{
  fields: Readonly<Omit<StateMachineSourceInput, "part">>;
  error: string;
}>;

type DraftAction =
  | Readonly<{ type: "changed"; field: keyof DraftState["fields"]; value: string }>
  | Readonly<{ type: "failed"; message: string }>
  | Readonly<{ type: "added" }>;

const initialDraft: DraftState = {
  fields: { name: "", from: "", to: "", event: "" },
  error: "",
};

const reduceDraft = (draft: DraftState, action: DraftAction): DraftState => {
  switch (action.type) {
    case "changed":
      return { ...draft, fields: { ...draft.fields, [action.field]: action.value } };
    case "failed":
      return { ...draft, error: action.message };
    case "added":
      return { fields: { ...draft.fields, name: "", event: "" }, error: "" };
  }
};

export type UseStateMachineDraftResult = Readonly<{
  fields: DraftState["fields"];
  error: string;
  changeField: (field: keyof DraftState["fields"], value: string) => void;
  submit: () => void;
}>;

/**
 * 選択中の追加フォームの下書きと検証結果を管理する。
 * フォームの対象を切り替えるとコンポーネントごと再生成される。
 *
 * @param params 対象マシンまたはパーツ、文書全文、変更通知。
 * @returns フォームの入力値・エラー・確定操作。
 */
export function useStateMachineDraft({ source, onChange, target }: UseStateMachineDraftParams): UseStateMachineDraftResult {
  const [draft, dispatch] = useReducer(reduceDraft, initialDraft);
  const submit = () => {
    const result = target.kind === "machine"
      ? StateMachineSource.create(source, draft.fields.name)
      : StateMachineSource.add(source, target.resolution, { part: target.part, ...draft.fields });
    if (Result.isErr(result)) {
      dispatch({ type: "failed", message: result.error });
      return;
    }
    onChange(result.value);
    dispatch({ type: "added" });
  };

  return {
    fields: draft.fields,
    error: draft.error,
    changeField: (field, value) => dispatch({ type: "changed", field, value }),
    submit,
  };
}
