import { useReducer } from "react";
import { Result } from "@domain-modeler/model-core";
import { AnalyzedModel } from "../../domains/analyzed-model";
import { StateMachineGraph } from "../../domains/state-machine-graph";
import { StateMachineLayout } from "../../domains/state-machine-layout";
import {
  StateMachineSource,
  type StateMachinePart,
  type StateMachineSourceInput,
} from "../../domains/state-machine-source";

type UseStateMachineScreenParams = Readonly<{
  value: string;
  onChange: (text: string) => void;
}>;

export type StateMachineSelection = Readonly<{ kind: "node" | "edge"; id: string }>;

type ScreenTarget =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "part"; part: StateMachinePart }>
  | Readonly<{ kind: "element"; selection: StateMachineSelection }>;

type StateMachineScreenState = Readonly<{
  machineIndex: number;
  target: ScreenTarget;
  zoom: number;
  error: string;
  draft: Readonly<Omit<StateMachineSourceInput, "part">>;
}>;

type StateMachineScreenAction =
  | Readonly<{ type: "machineSelected"; index: number }>
  | Readonly<{ type: "partSelected"; part: StateMachinePart }>
  | Readonly<{ type: "elementSelected"; selection: StateMachineSelection }>
  | Readonly<{ type: "zoomed"; factor: number }>
  | Readonly<{ type: "fitted" }>
  | Readonly<{ type: "draftChanged"; field: keyof StateMachineScreenState["draft"]; value: string }>
  | Readonly<{ type: "failed"; message: string }>
  | Readonly<{ type: "added" }>;

const initialState: StateMachineScreenState = {
  machineIndex: 0,
  target: { kind: "none" },
  zoom: 1,
  error: "",
  draft: { name: "", from: "", to: "", event: "" },
};

const reduceScreen = (state: StateMachineScreenState, action: StateMachineScreenAction): StateMachineScreenState => {
  switch (action.type) {
    case "machineSelected":
      return { ...state, machineIndex: action.index, target: { kind: "none" }, zoom: 1 };
    case "partSelected":
      return { ...state, target: { kind: "part", part: action.part }, error: "" };
    case "elementSelected":
      return { ...state, target: { kind: "element", selection: action.selection }, error: "" };
    case "zoomed":
      return { ...state, zoom: Math.max(0.5, Math.min(3, state.zoom * action.factor)) };
    case "fitted":
      return { ...state, zoom: 1 };
    case "draftChanged":
      return { ...state, draft: { ...state.draft, [action.field]: action.value } };
    case "failed":
      return { ...state, error: action.message };
    case "added":
      return { ...state, error: "", draft: { ...state.draft, name: "", event: "" } };
  }
};

export type UseStateMachineScreenResult = Readonly<{
  analyzed: AnalyzedModel;
  selectedMachineIndex: number;
  graph: StateMachineGraph | null;
  layout: StateMachineLayout | null;
  target: ScreenTarget;
  zoom: number;
  error: string;
  draft: StateMachineScreenState["draft"];
  selectMachine: (index: number) => void;
  selectPart: (part: StateMachinePart) => void;
  selectElement: (selection: StateMachineSelection) => void;
  zoomBy: (factor: number) => void;
  fit: () => void;
  changeDraft: (field: keyof StateMachineScreenState["draft"], value: string) => void;
  addMachine: () => void;
  addPart: () => void;
}>;

/**
 * ステートマシン画面の選択・入力・倍率を一つの編集セッションとして管理する。
 * グラフとレイアウトは文書から導出し、保存する状態には含めない。
 *
 * @param params 同じ `.dmodel` の全文と更新通知。
 * @returns 画面状態、導出されたグラフ、操作。
 */
export function useStateMachineScreen({ value, onChange }: UseStateMachineScreenParams): UseStateMachineScreenResult {
  const [state, dispatch] = useReducer(reduceScreen, initialState);
  const analyzed = AnalyzedModel.create(value);
  const selectedMachineIndex = Math.min(state.machineIndex, analyzed.stateMachines.length - 1);
  const resolution = analyzed.stateMachines[selectedMachineIndex];
  const graph = resolution === undefined ? null : StateMachineGraph.create(resolution, analyzed.diagnostics);
  const layout = graph === null ? null : StateMachineLayout.create(graph);

  const addMachine = () => {
    const result = StateMachineSource.create(value, state.draft.name);
    if (Result.isErr(result)) {
      dispatch({ type: "failed", message: result.error });
      return;
    }
    onChange(result.value);
    dispatch({ type: "added" });
  };
  const addPart = () => {
    if (resolution === undefined || state.target.kind !== "part") {
      return;
    }
    const result = StateMachineSource.add(value, resolution, { part: state.target.part, ...state.draft });
    if (Result.isErr(result)) {
      dispatch({ type: "failed", message: result.error });
      return;
    }
    onChange(result.value);
    dispatch({ type: "added" });
  };

  return {
    analyzed,
    selectedMachineIndex,
    graph,
    layout,
    target: state.target,
    zoom: state.zoom,
    error: state.error,
    draft: state.draft,
    selectMachine: (index) => dispatch({ type: "machineSelected", index }),
    selectPart: (part) => dispatch({ type: "partSelected", part }),
    selectElement: (selection) => dispatch({ type: "elementSelected", selection }),
    zoomBy: (factor) => dispatch({ type: "zoomed", factor }),
    fit: () => dispatch({ type: "fitted" }),
    changeDraft: (field, nextValue) => dispatch({ type: "draftChanged", field, value: nextValue }),
    addMachine,
    addPart,
  };
}
