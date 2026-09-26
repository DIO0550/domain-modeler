import { useReducer } from "react";
import { AnalyzedModel } from "../../domains/analyzed-model";
import { StateMachineGraph } from "../../domains/state-machine-graph";
import { StateMachineLayout } from "../../domains/state-machine-layout";
import type { StateMachinePart } from "../../domains/state-machine-source";

export type StateMachineSelection = Readonly<{ kind: "node" | "edge"; id: string }>;

type ViewTarget =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "part"; part: StateMachinePart }>
  | Readonly<{ kind: "element"; selection: StateMachineSelection }>;

type ViewState = Readonly<{
  machineIndex: number;
  target: ViewTarget;
  zoom: number;
}>;

type ViewAction =
  | Readonly<{ type: "machineSelected"; index: number }>
  | Readonly<{ type: "partSelected"; part: StateMachinePart }>
  | Readonly<{ type: "elementSelected"; selection: StateMachineSelection }>
  | Readonly<{ type: "zoomed"; factor: number }>
  | Readonly<{ type: "fitted" }>;

const initialView: ViewState = {
  machineIndex: 0,
  target: { kind: "none" },
  zoom: 1,
};

const reduceView = (view: ViewState, action: ViewAction): ViewState => {
  switch (action.type) {
    case "machineSelected":
      return { machineIndex: action.index, target: { kind: "none" }, zoom: 1 };
    case "partSelected":
      return { ...view, target: { kind: "part", part: action.part } };
    case "elementSelected":
      return { ...view, target: { kind: "element", selection: action.selection } };
    case "zoomed":
      return { ...view, zoom: Math.max(0.5, Math.min(3, view.zoom * action.factor)) };
    case "fitted":
      return { ...view, zoom: 1 };
  }
};

export type UseStateMachineViewResult = Readonly<{
  analyzed: AnalyzedModel;
  selectedMachineIndex: number;
  graph: StateMachineGraph | null;
  layout: StateMachineLayout | null;
  target: ViewTarget;
  zoom: number;
  selectMachine: (index: number) => void;
  selectPart: (part: StateMachinePart) => void;
  selectElement: (selection: StateMachineSelection) => void;
  zoomBy: (factor: number) => void;
  fit: () => void;
}>;

/**
 * 表示中のマシン、選択対象、倍率を管理する。
 * グラフとレイアウトは入力された文書から毎回導出する。
 *
 * @param source `.dmodel` 全文。
 * @returns 表示するグラフと切替・選択・倍率操作。
 */
export function useStateMachineView(source: string): UseStateMachineViewResult {
  const [view, dispatch] = useReducer(reduceView, initialView);
  const analyzed = AnalyzedModel.create(source);
  const selectedMachineIndex = Math.min(view.machineIndex, analyzed.stateMachines.length - 1);
  const resolution = analyzed.stateMachines[selectedMachineIndex];
  const graph = resolution === undefined ? null : StateMachineGraph.create(resolution, analyzed.diagnostics);
  const layout = graph === null ? null : StateMachineLayout.create(graph);

  return {
    analyzed,
    selectedMachineIndex,
    graph,
    layout,
    target: view.target,
    zoom: view.zoom,
    selectMachine: (index) => dispatch({ type: "machineSelected", index }),
    selectPart: (part) => dispatch({ type: "partSelected", part }),
    selectElement: (selection) => dispatch({ type: "elementSelected", selection }),
    zoomBy: (factor) => dispatch({ type: "zoomed", factor }),
    fit: () => dispatch({ type: "fitted" }),
  };
}
