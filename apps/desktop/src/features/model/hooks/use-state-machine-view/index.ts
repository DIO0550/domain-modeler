import { useReducer } from "react";
import { AnalyzedModel } from "../../domains/analyzed-model";
import {
  StateMachineGraph,
  type StateMachineGraphInspection,
  type StateMachineGraphSelection,
} from "../../domains/state-machine-graph";
import { StateMachineLayout, type GraphPoint } from "../../domains/state-machine-layout";
import type { StateMachineResolution } from "@domain-modeler/model-core";
import type { StateMachinePart } from "../../domains/state-machine-source";
import { Option, type Option as Optional } from "@/utils/Option";

type ViewTarget =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "part"; part: StateMachinePart }>
  | Readonly<{ kind: "element"; selection: StateMachineGraphSelection }>;

type ViewState = Readonly<{
  machineIndex: number;
  target: ViewTarget;
  origin: Optional<string>;
  destination: Optional<string>;
  zoom: number;
  pan: GraphPoint;
}>;

type ViewAction =
  | Readonly<{ type: "machineSelected"; index: number }>
  | Readonly<{ type: "partSelected"; part: StateMachinePart; origin: Optional<string> }>
  | Readonly<{ type: "transitionDrawn"; from: string; to: string }>
  | Readonly<{ type: "elementSelected"; selection: StateMachineGraphSelection }>
  | Readonly<{ type: "selectionCleared" }>
  | Readonly<{ type: "zoomed"; factor: number; anchor: GraphPoint }>
  | Readonly<{ type: "panned"; delta: GraphPoint }>
  | Readonly<{ type: "fitted" }>;

const initialView: ViewState = {
  machineIndex: 0,
  target: { kind: "none" },
  origin: Option.none(),
  destination: Option.none(),
  zoom: 1,
  pan: { x: 0, y: 0 },
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

/** `anchor` の位置が画面上で動かないように倍率を変える。 */
const zoomAround = (view: ViewState, factor: number, anchor: GraphPoint): ViewState => {
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, view.zoom * factor));
  const ratio = view.zoom / zoom;
  return {
    ...view,
    zoom,
    pan: {
      x: anchor.x - (anchor.x - view.pan.x) * ratio,
      y: anchor.y - (anchor.y - view.pan.y) * ratio,
    },
  };
};

const reduceView = (view: ViewState, action: ViewAction): ViewState => {
  switch (action.type) {
    case "machineSelected":
      return { ...initialView, machineIndex: action.index };
    case "partSelected":
      return { ...view, target: { kind: "part", part: action.part }, origin: action.origin, destination: Option.none() };
    case "transitionDrawn":
      return {
        ...view,
        target: { kind: "part", part: "transition" },
        origin: Option.some(action.from),
        destination: Option.some(action.to),
      };
    case "elementSelected":
      return {
        ...view,
        target: { kind: "element", selection: action.selection },
        origin: Option.none(),
        destination: Option.none(),
      };
    case "selectionCleared":
      return { ...view, target: { kind: "none" }, origin: Option.none(), destination: Option.none() };
    case "zoomed":
      return zoomAround(view, action.factor, action.anchor);
    case "panned":
      return { ...view, pan: { x: view.pan.x + action.delta.x, y: view.pan.y + action.delta.y } };
    case "fitted":
      return { ...view, zoom: 1, pan: { x: 0, y: 0 } };
  }
};

export type UseStateMachineViewResult = Readonly<{
  analyzed: AnalyzedModel;
  selectedMachineIndex: number;
  graph: StateMachineGraph | null;
  layout: StateMachineLayout | null;
  resolution: StateMachineResolution | null;
  inspection: StateMachineGraphInspection | null;
  target: ViewTarget;
  /** パーツ選択の直前に選んでいた状態名。遷移の追加で遷移元の初期値にする。 */
  origin: Optional<string>;
  /** グラフ上で線を引いて決めた遷移先の状態名。 */
  destination: Optional<string>;
  zoom: number;
  /** 全体表示からの表示中心のずれ(グラフ座標)。 */
  pan: GraphPoint;
  selectMachine: (index: number) => void;
  selectPart: (part: StateMachinePart) => void;
  /** 遷移元・遷移先を指定した遷移の追加フォームを開く。 */
  drawTransition: (from: string, to: string) => void;
  selectElement: (selection: StateMachineGraphSelection) => void;
  clearSelection: () => void;
  /**
   * 倍率を変える。
   *
   * @param factor 現在の倍率に掛ける値。
   * @param anchor 画面上で動かさない点。グラフ全体の中心からの相対座標で、省略時は表示中心。
   */
  zoomBy: (factor: number, anchor?: GraphPoint) => void;
  panBy: (delta: GraphPoint) => void;
  fit: () => void;
}>;

/**
 * 表示中のマシン、選択対象、倍率と表示位置を管理する。
 * グラフとレイアウトは入力された文書から毎回導出する。
 *
 * @param source `.dmodel` 全文。
 * @returns 表示するグラフと切替・選択・倍率操作。
 */
export function useStateMachineView(
  source: string,
  initialMachineIndex = 0,
  onMachineSelected?: (index: number) => void,
): UseStateMachineViewResult {
  const [view, dispatch] = useReducer(reduceView, initialMachineIndex, (index) => ({ ...initialView, machineIndex: index }));
  const analyzed = AnalyzedModel.create(source);
  const selectedMachineIndex = Math.min(view.machineIndex, analyzed.stateMachines.length - 1);
  const resolution = analyzed.stateMachines[selectedMachineIndex];
  const graph = resolution === undefined ? null : StateMachineGraph.create(resolution, analyzed.diagnostics);
  const layout = graph === null ? null : StateMachineLayout.create(graph);
  let inspection: StateMachineGraphInspection | null = null;
  if (graph !== null) {
    const selection = view.target.kind === "element" ? view.target.selection : undefined;
    inspection = StateMachineGraph.inspect(graph, selection);
  }

  return {
    analyzed,
    selectedMachineIndex,
    graph,
    layout,
    resolution: resolution ?? null,
    inspection,
    target: view.target,
    origin: view.origin,
    destination: view.destination,
    zoom: view.zoom,
    pan: view.pan,
    selectMachine: (index) => {
      dispatch({ type: "machineSelected", index });
      onMachineSelected?.(index);
    },
    selectPart: (part) => dispatch({
      type: "partSelected",
      part,
      origin: inspection?.kind === "node" ? Option.some(inspection.node.name) : Option.none(),
    }),
    drawTransition: (from, to) => dispatch({ type: "transitionDrawn", from, to }),
    selectElement: (selection) => dispatch({ type: "elementSelected", selection }),
    clearSelection: () => dispatch({ type: "selectionCleared" }),
    zoomBy: (factor, anchor = view.pan) => dispatch({ type: "zoomed", factor, anchor }),
    panBy: (delta) => dispatch({ type: "panned", delta }),
    fit: () => dispatch({ type: "fitted" }),
  };
}
