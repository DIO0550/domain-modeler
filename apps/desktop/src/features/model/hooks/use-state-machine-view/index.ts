import { Result } from "@domain-modeler/model-core";
import { StateMachinePlacement } from "../../domains/state-machine-placement";
import { useReducer } from "react";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../domains/analyzed-model";
import {
  StateMachineGraph,
  type StateMachineGraphInspection,
  type StateMachineGraphSelection,
} from "../../domains/state-machine-graph";
import { StateMachineLayout } from "../../domains/state-machine-layout";
import type { StateMachineResolution } from "@domain-modeler/model-core";
import type { StateMachinePart } from "../../domains/state-machine-source";
import { StateMachineViewport } from "../../domains/state-machine-viewport";
import type { StateMachinePosition } from "../../domains/state-machine-position";

type ViewTarget =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "machine" }>
  | Readonly<{
      kind: "part";
      part: StateMachinePart;
      initialFrom: Option<string>;
    }>
  | Readonly<{ kind: "element"; selection: StateMachineGraphSelection }>;

type ViewState = Readonly<{
  machineIndex: number;
  target: ViewTarget;
  viewport: StateMachineViewport;
}>;

type ViewAction =
  | Readonly<{ type: "machineSelected"; index: number }>
  | Readonly<{ type: "machineCreationStarted" }>
  | Readonly<{
      type: "partSelected";
      part: StateMachinePart;
      initialFrom: Option<string>;
    }>
  | Readonly<{ type: "elementSelected"; selection: StateMachineGraphSelection }>
  | Readonly<{ type: "selectionCleared" }>
  | Readonly<{
      type: "zoomed";
      factor: number;
      anchor: Option<StateMachinePosition>;
    }>
  | Readonly<{ type: "panned"; delta: StateMachinePosition }>
  | Readonly<{ type: "fitted" }>;

const initialView: ViewState = {
  machineIndex: 0,
  target: { kind: "none" },
  viewport: StateMachineViewport.create(),
};

const reduceView = (view: ViewState, action: ViewAction): ViewState => {
  switch (action.type) {
    case "machineSelected":
      return { ...initialView, machineIndex: action.index };

    case "machineCreationStarted":
      return { ...view, target: { kind: "machine" } };

    case "partSelected":
      return {
        ...view,
        target: {
          kind: "part",
          part: action.part,
          initialFrom: action.initialFrom,
        },
      };

    case "elementSelected":
      return {
        ...view,
        target: { kind: "element", selection: action.selection },
      };

    case "selectionCleared":
      return { ...view, target: { kind: "none" } };

    case "zoomed":
      return {
        ...view,
        viewport: StateMachineViewport.zoomBy(
          view.viewport,
          action.factor,
          action.anchor.some ? action.anchor.value : view.viewport.pan,
        ),
      };

    case "panned":
      return {
        ...view,
        viewport: StateMachineViewport.panBy(view.viewport, action.delta),
      };

    case "fitted":
      return { ...view, viewport: StateMachineViewport.create() };
  }
};

export type UseStateMachineViewResult = Readonly<{
  analyzed: AnalyzedModel;
  selectedMachineIndex: number;
  graph: StateMachineGraph | null;
  layout: StateMachineLayout | null;
  resolution: StateMachineResolution | null;
  placementError: string;
  inspection: StateMachineGraphInspection | null;
  target: ViewTarget;
  zoom: number;
  viewport: StateMachineViewport;
  selectMachine: (index: number) => void;
  startMachineCreation: () => void;
  selectPart: (part: StateMachinePart) => void;
  selectElement: (selection: StateMachineGraphSelection) => void;
  clearSelection: () => void;
  zoomBy: (factor: number, anchor?: StateMachinePosition) => void;
  panBy: (delta: StateMachinePosition) => void;
  fit: () => void;
}>;

/**
 * 表示中のマシン、選択対象、倍率と表示位置を管理する。
 * グラフとレイアウトは入力された文書から毎回導出する。
 *
 * @param source `.dmodel` 全文。
 * @returns 表示するグラフと切替・選択・倍率・パン操作。
 */
export function useStateMachineView(
  source: string,
  initialMachineIndex = 0,
  onMachineSelected?: (index: number) => void,
): UseStateMachineViewResult {
  const [view, dispatch] = useReducer(
    reduceView,
    initialMachineIndex,
    (index) => ({ ...initialView, machineIndex: index }),
  );

  const analyzed = AnalyzedModel.create(source);
  const selectedMachineIndex = Math.min(
    view.machineIndex,
    analyzed.stateMachines.length - 1,
  );
  const resolution = analyzed.stateMachines[selectedMachineIndex];

  const graph =
    resolution === undefined
      ? null
      : StateMachineGraph.create(resolution, analyzed.diagnostics);
  const placement =
    resolution === undefined
      ? Result.ok({})
      : StateMachinePlacement.read(source, resolution);
  const layout =
    graph === null
      ? null
      : StateMachineLayout.restore(
          graph,
          Result.isOk(placement) ? placement.value : {},
        );

  let inspection: StateMachineGraphInspection | null = null;

  if (graph !== null) {
    const selection =
      view.target.kind === "element" ? view.target.selection : undefined;

    inspection = StateMachineGraph.inspect(graph, selection);
  }

  return {
    analyzed,
    selectedMachineIndex,
    graph,
    layout,
    resolution: resolution ?? null,
    placementError: Result.isErr(placement) ? placement.error : "",
    inspection,
    target: view.target,
    zoom: view.viewport.zoom,
    viewport: view.viewport,

    selectMachine: (index) => {
      dispatch({ type: "machineSelected", index });
      onMachineSelected?.(index);
    },

    startMachineCreation: () => dispatch({ type: "machineCreationStarted" }),

    selectPart: (part) =>
      dispatch({
        type: "partSelected",
        part,
        initialFrom:
          inspection?.kind === "node"
            ? Option.some(inspection.node.name)
            : Option.none(),
      }),

    selectElement: (selection) =>
      dispatch({ type: "elementSelected", selection }),

    clearSelection: () => dispatch({ type: "selectionCleared" }),

    zoomBy: (factor, anchor) =>
      dispatch({
        type: "zoomed",
        factor,
        anchor: anchor === undefined ? Option.none() : Option.some(anchor),
      }),

    panBy: (delta) => dispatch({ type: "panned", delta }),

    fit: () => dispatch({ type: "fitted" }),
  };
}
