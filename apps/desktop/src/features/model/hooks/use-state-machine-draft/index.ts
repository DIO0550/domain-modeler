import { useReducer } from "react";
import { Result, type Result as ResultValue, type StateMachineResolution } from "@domain-modeler/model-core";
import type { Option } from "@/utils/Option";
import { StateMachineGraph, type StateMachineGraphSelection } from "../../domains/state-machine-graph";
import {
  StateMachineSource,
  type StateMachinePart,
  type StateMachineSourceInput,
  type StateMachineStateInput,
  type StateMachineTransitionInput,
} from "../../domains/state-machine-source";

export type StateMachineDraftTarget =
  | Readonly<{ kind: "machine" }>
  | Readonly<{ kind: "part"; part: "state"; resolution: StateMachineResolution }>
  | Readonly<{
    kind: "part";
    part: "transition";
    resolution: StateMachineResolution;
    origin: Option<string>;
    destination: Option<string>;
  }>;

/** 追加に成功した対象。 */
export type StateMachineDraftCreated =
  | Readonly<{ kind: "machine" }>
  | Readonly<{ kind: "element"; selection: StateMachineGraphSelection }>;

type UseStateMachineDraftParams = Readonly<{
  source: string;
  onChange: (text: string) => void;
  target: StateMachineDraftTarget;
  onCreated?: (created: StateMachineDraftCreated) => void;
}>;

type DraftFields = Readonly<StateMachineStateInput & StateMachineTransitionInput>;

type DraftState = Readonly<{
  fields: DraftFields;
  error: string;
}>;

type DraftAction =
  | Readonly<{ type: "changed"; field: keyof DraftFields; value: string | boolean }>
  | Readonly<{ type: "failed"; message: string }>
  | Readonly<{ type: "added" }>;

const emptyDraft: DraftState = {
  fields: { name: "", initial: false, terminal: false, from: "", to: "", event: "" },
  error: "",
};

/** 遷移元にできる状態名(終端状態を除く)。 */
const transitionSources = (resolution: StateMachineResolution): readonly string[] =>
  resolution.machine.states.filter((state) => !state.terminal).map((state) => state.name);

const initialDraft = (target: StateMachineDraftTarget): DraftState => {
  if (target.kind !== "part" || target.part !== "transition") {
    return emptyDraft;
  }
  const sources = transitionSources(target.resolution);
  const states = target.resolution.machine.states.map((state) => state.name);
  const origin = target.origin.some ? target.origin.value : "";
  const from = sources.includes(origin) ? origin : sources[0] ?? "";
  const destination = target.destination.some ? target.destination.value : "";
  const to = states.includes(destination) ? destination : states.find((name) => name !== from) ?? from;
  return { ...emptyDraft, fields: { ...emptyDraft.fields, from, to } };
};

const sourceInput = (part: StateMachinePart, fields: DraftFields): StateMachineSourceInput => {
  if (part === "transition") {
    return { part, from: fields.from, to: fields.to, event: fields.event };
  }
  return { part, name: fields.name, initial: fields.initial, terminal: fields.terminal };
};

const createdOf = (input: StateMachineSourceInput): StateMachineDraftCreated => ({
  kind: "element",
  selection: input.part === "transition"
    ? StateMachineGraph.transitionSelection(input)
    : StateMachineGraph.stateSelection(input.name),
});

const reduceDraft = (draft: DraftState, action: DraftAction): DraftState => {
  switch (action.type) {
    case "changed":
      return { ...draft, fields: { ...draft.fields, [action.field]: action.value } };
    case "failed":
      return { ...draft, error: action.message };
    case "added":
      return { fields: { ...draft.fields, name: "", initial: false, terminal: false, event: "" }, error: "" };
  }
};

type TransitionOptions = Readonly<{ from: readonly string[]; to: readonly string[] }>;

const transitionOptions = (target: StateMachineDraftTarget): TransitionOptions => {
  if (target.kind === "machine") {
    return { from: [], to: [] };
  }
  return {
    from: transitionSources(target.resolution),
    to: target.resolution.machine.states.map((state) => state.name),
  };
};

export type UseStateMachineDraftResult = Readonly<{
  fields: DraftFields;
  /** 遷移の追加で遷移元・遷移先に選べる状態名。 */
  options: TransitionOptions;
  error: string;
  changeField: <K extends keyof DraftFields>(field: K, value: DraftFields[K]) => void;
  /** 追加に成功したら `true`。 */
  submit: () => boolean;
}>;

/**
 * 選択中の追加フォームの下書きと検証結果を管理する。
 * フォームの対象を切り替えるとコンポーネントごと再生成される。
 *
 * @param params 対象マシンまたはパーツ、文書全文、変更通知、追加成功の通知。
 * @returns フォームの入力値・エラー・確定操作。
 */
export function useStateMachineDraft({ source, onChange, target, onCreated }: UseStateMachineDraftParams): UseStateMachineDraftResult {
  const [draft, dispatch] = useReducer(reduceDraft, target, initialDraft);
  const commit = (result: ResultValue<string, string>, created: () => StateMachineDraftCreated): boolean => {
    if (Result.isErr(result)) {
      dispatch({ type: "failed", message: result.error });
      return false;
    }
    onChange(result.value);
    dispatch({ type: "added" });
    onCreated?.(created());
    return true;
  };
  const submit = (): boolean => {
    if (target.kind === "machine") {
      return commit(StateMachineSource.create(source, draft.fields.name), () => ({ kind: "machine" }));
    }
    const input = sourceInput(target.part, draft.fields);
    return commit(StateMachineSource.add(source, target.resolution, input), () => createdOf(input));
  };

  return {
    fields: draft.fields,
    options: transitionOptions(target),
    error: draft.error,
    changeField: (field, value) => dispatch({ type: "changed", field, value }),
    submit,
  };
}
