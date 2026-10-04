import { useReducer } from "react";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../domains/analyzed-model";
import { StateMachineGraph, type StateMachineGraphSelection } from "../../domains/state-machine-graph";
import { StateMachineTransitionChoices } from "../../domains/state-machine-transition-choices";
import { Result, type StateMachineResolution } from "@domain-modeler/model-core";
import {
  StateMachineSource,
  type StateMachinePart,
  type StateMachineStateInput,
  type StateMachineTransitionInput,
} from "../../domains/state-machine-source";

export type StateMachineDraftTarget =
  | Readonly<{ kind: "machine" }>
  | Readonly<{ kind: "part"; part: StateMachinePart; resolution: StateMachineResolution }>;

type UseStateMachineDraftParams = Readonly<{
  source: string;
  onChange: (text: string) => void;
  onSelect: (selection: StateMachineGraphSelection) => void;
  onMachineCreated: (index: number) => void;
  target: StateMachineDraftTarget;
  initialFrom?: Option<string>;
}>;

type DraftState = Readonly<{
  fields: Readonly<StateMachineStateInput & StateMachineTransitionInput>;
  error: string;
}>;

type DraftAction =
  | Readonly<{ type: "changed"; fields: Partial<DraftState["fields"]> }>
  | Readonly<{ type: "failed"; message: string }>
  | Readonly<{ type: "added" }>;

const initialDraft: DraftState = {
  fields: { name: "", initial: false, terminal: false, from: "", to: "", event: "" },
  error: "",
};

const reduceDraft = (draft: DraftState, action: DraftAction): DraftState => {
  switch (action.type) {
    case "changed":
      return { ...draft, fields: { ...draft.fields, ...action.fields } };
    case "failed":
      return { ...draft, error: action.message };
    case "added":
      return { fields: { ...draft.fields, name: "", initial: false, terminal: false, event: "" }, error: "" };
  }
};

export type UseStateMachineDraftResult = Readonly<{
  fields: DraftState["fields"];
  transitionChoices: StateMachineTransitionChoices;
  error: string;
  changeField: <K extends keyof DraftState["fields"]>(field: K, value: DraftState["fields"][K]) => void;
  submit: () => boolean;
}>;

/**
 * 選択中の追加フォームの下書きと検証結果を管理する。
 * フォームの対象を切り替えるとコンポーネントごと再生成される。
 *
 * @param params 対象マシンまたはパーツ、文書全文、文書変更・要素選択・マシン作成の通知、フォームを開いた時点の遷移元。
 * @returns フォームの入力値・エラー・確定操作。
 */
export function useStateMachineDraft({ source, onChange, onSelect, onMachineCreated, target, initialFrom = Option.none() }: UseStateMachineDraftParams): UseStateMachineDraftResult {
  const [draft, dispatch] = useReducer(reduceDraft, initialFrom, (from) => ({
    ...initialDraft,
    fields: { ...initialDraft.fields, from: from.some ? from.value : "" },
  }));
  const transitionChoices = target.kind === "part"
    ? StateMachineTransitionChoices.create(target.resolution.machine)
    : { from: [], to: [] };
  const fields = target.kind === "part" && target.part === "transition"
    ? { ...draft.fields, ...StateMachineTransitionChoices.selection(transitionChoices, draft.fields) }
    : draft.fields;
  const submit = (): boolean => {
    const result = target.kind === "machine"
      ? StateMachineSource.create(source, fields.name)
      : StateMachineSource.add(source, target.resolution, { part: target.part, ...fields });
    if (Result.isErr(result)) {
      dispatch({ type: "failed", message: result.error });
      return false;
    }
    onChange(result.value);
    dispatch({ type: "added" });
    if (target.kind === "machine") {
      onMachineCreated(AnalyzedModel.create(result.value).stateMachines.length - 1);
      return true;
    }
    onSelect(target.part === "state"
      ? StateMachineGraph.stateSelection(fields.name)
      : StateMachineGraph.transitionSelection(fields));
    return true;
  };

  return {
    fields,
    transitionChoices,
    error: draft.error,
    changeField: (field, value) => dispatch({ type: "changed", fields: { [field]: value } }),
    submit,
  };
}
