import { useReducer, useRef, type PointerEvent, type KeyboardEvent, type MouseEvent } from "react";
import { Result } from "@domain-modeler/model-core";
import { SvgCanvas } from "@/libs/svg-canvas";
import { Option } from "@/utils/Option";
import { EventTargetEx } from "@/utils/EventTargetEx";
import { StateMachineActivation } from "../../domains/state-machine-activation";
import { StateMachineLabelEdit } from "../../domains/state-machine-label-edit";
import { StateMachineConnection } from "../../domains/state-machine-connection";
import { StateMachineGesture } from "../../domains/state-machine-gesture";
import { StateMachineGraph, type StateMachineGraphSelection } from "../../domains/state-machine-graph";
import { StateMachineLayout } from "../../domains/state-machine-layout";
import { StateMachinePlacement } from "../../domains/state-machine-placement";
import { StateMachineSource } from "../../domains/state-machine-source";
import type { UseStateMachineViewResult } from "../use-state-machine-view";

type UseStateMachineCanvasParams = Readonly<{
  view: UseStateMachineViewResult;
  source: string;
  onChange: (source: string) => void;
}>;

type CanvasState = Readonly<{
  interaction:
    | Readonly<{ kind: "idle" }>
    | Readonly<{ kind: "gesture"; gesture: StateMachineGesture }>
    | Readonly<{ kind: "label"; edit: StateMachineLabelEdit; source: string; target: UseStateMachineViewResult["target"] }>
    | Readonly<{ kind: "draft"; connection: Extract<StateMachineConnection, { kind: "connected" }>; source: string; target: UseStateMachineViewResult["target"] }>;
  error: string;
  frame: ReturnType<typeof StateMachineLayout.frame>;
}>;
type CanvasAction =
  | Readonly<{ type: "gesture"; gesture: Option<StateMachineGesture> }>
  | Readonly<{ type: "finished"; error: string }>
  | Readonly<{ type: "label"; interaction: Extract<CanvasState["interaction"], { kind: "label" }> }>
  | Readonly<{ type: "draft"; interaction: Extract<CanvasState["interaction"], { kind: "draft" }> }>
  | Readonly<{ type: "fit"; frame: CanvasState["frame"] }>;

const reduceCanvas = (state: CanvasState, action: CanvasAction): CanvasState => {
  switch (action.type) {
    case "gesture":
      return { ...state, interaction: action.gesture.some ? { kind: "gesture", gesture: action.gesture.value } : { kind: "idle" }, error: "" };
    case "finished":
      return { ...state, interaction: { kind: "idle" }, error: action.error };
    case "fit":
      return { ...state, frame: action.frame, interaction: { kind: "idle" } };
    case "label":
    case "draft":
      return { ...state, interaction: action.interaction, error: "" };
  }
};

/**
 * 配置・移動・接続・名前編集・キーボード削除を仲介する。文書への書き込みは確定時の1回だけ。
 * @param params 現在のマシン、全文と変更通知。
 * @returns 描画用の配置、固定された表示範囲、ポインター操作と自動整列。
 */
export function useStateMachineCanvas({ view, source, onChange }: UseStateMachineCanvasParams) {
  const svgRef = useRef<SVGSVGElement>(null);
  // 捕捉解除イベントがReactの再描画より先に来ても、二重確定しないための操作ハンドル。
  const active = useRef<Option<StateMachineGesture>>(Option.none());
  // ポインター操作後に届くclick/dblclickの判定用。描画では参照しない。
  const activation = useRef<StateMachineActivation>("ready");
  const [state, dispatch] = useReducer(reduceCanvas, view.layout, (layout): CanvasState => ({
    interaction: { kind: "idle" }, error: "",
    frame: StateMachineLayout.frame(layout ?? { left: -100, top: -100, width: 0, height: 0 }),
  }));
  if ((state.interaction.kind === "label" || state.interaction.kind === "draft")
    && (state.interaction.source !== source || state.interaction.target !== view.target)) {
    // 外部更新や別の選択で破棄し、Undoで同じ全文へ戻っても下書きを再表示しない。
    dispatch({ type: "finished", error: "" });
  }
  const labelEdit: Option<StateMachineLabelEdit> = state.interaction.kind === "label"
    && state.interaction.source === source && state.interaction.target === view.target
    ? Option.some(state.interaction.edit) : Option.none();
  const gesture: Option<StateMachineGesture> = state.interaction.kind === "gesture" ? Option.some(state.interaction.gesture) : Option.none();
  const draft: Option<Extract<StateMachineConnection, { kind: "connected" }>> = state.interaction.kind === "draft" && state.interaction.source === source && state.interaction.target === view.target
    ? Option.some(state.interaction.connection) : Option.none();
  const connectionAt = (current: StateMachineGesture): Option<StateMachineConnection> => {
    if (current.source !== source || current.target.kind !== "connection" || view.graph === null || view.layout === null || view.resolution === null) {
      return Option.none();
    }
    return StateMachineConnection.preview({ graph: view.graph, layout: view.layout, resolution: view.resolution }, current);
  };
  const connection = gesture.some ? connectionAt(gesture.value) : draft;
  const preview = StateMachineGesture.nodePosition(gesture, source);
  let layout = view.layout;
  if (preview.some && view.graph !== null && layout !== null) {
    layout = StateMachineLayout.position(view.graph, {
      ...layout.nodes,
      [StateMachineGraph.stateSelection(preview.value.name).id]: preview.value.point,
    });
  }
  const finish = (result: ReturnType<typeof StateMachineSource.arrange>) => {
    if (Result.isErr(result)) {
      dispatch({ type: "finished", error: result.error });
      return false;
    }
    dispatch({ type: "finished", error: "" });
    if (result.value !== source) {
      onChange(result.value);
    }
    return true;
  };
  const cancel = () => {
    activation.current = StateMachineActivation.block();
    const previous = active.current;
    active.current = Option.none();
    dispatch({ type: "finished", error: "" });
    if (previous.some && svgRef.current !== null) {
      SvgCanvas.release(svgRef.current, previous.value.pointerId);
    }
  };
  const begin = (event: PointerEvent, target: StateMachineGesture["target"]) => {
    if (event.button !== 0 || active.current.some || svgRef.current === null) {
      return;
    }
    if (view.resolution === null) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const client = { x: event.clientX, y: event.clientY };
    const point = SvgCanvas.point(svgRef.current, client);
    const adjacent = SvgCanvas.point(svgRef.current, { x: client.x + 1, y: client.y + 1 });
    if (!point.some || !adjacent.some) {
      return;
    }
    let origin = point.value;
    if (target.kind === "edge") {
      view.selectElement({ kind: "edge", id: target.id });
    }
    if (target.kind === "connection") {
      if (!StateMachineConnection.canStart(view.resolution, target.name)) {
        return;
      }
      activation.current = StateMachineActivation.block();
      view.selectElement(StateMachineGraph.stateSelection(target.name));
    }
    if (target.kind === "node") {
      view.selectElement(StateMachineGraph.stateSelection(target.name));
      const positioned = view.layout?.nodes[StateMachineGraph.stateSelection(target.name).id];
      if (positioned === undefined || !StateMachinePlacement.isMovable(view.resolution, target.name)) {
        return;
      }
      origin = positioned;
    }
    const next: StateMachineGesture = {
      source, pointerId: event.pointerId, start: client, current: client, origin,
      scale: { x: adjacent.value.x - point.value.x, y: adjacent.value.y - point.value.y },
      moved: false, target,
    };
    active.current = Option.some(next);
    dispatch({ type: "gesture", gesture: active.current });
    SvgCanvas.capture(svgRef.current, event.pointerId);
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (!active.current.some || active.current.value.pointerId !== event.pointerId) {
      return;
    }
    active.current = Option.some(StateMachineGesture.move(active.current.value, { x: event.clientX, y: event.clientY }));
    dispatch({ type: "gesture", gesture: active.current });
  };
  const commit = (event: PointerEvent<SVGSVGElement>, lost = false) => {
    if (!active.current.some || active.current.value.pointerId !== event.pointerId) {
      return;
    }
    const next = lost ? active.current.value : StateMachineGesture.move(active.current.value, { x: event.clientX, y: event.clientY });
    active.current = Option.none();
    if (next.moved || lost || next.target.kind === "connection") {
      activation.current = StateMachineActivation.block();
    } else {
      activation.current = StateMachineActivation.finishClick(activation.current);
    }
    SvgCanvas.release(event.currentTarget, event.pointerId);
    dispatch({ type: "finished", error: "" });
    if (next.source !== source || view.resolution === null) {
      return;
    }
    if (next.target.kind === "connection") {
      const connected = connectionAt(next);
      if (!lost && next.moved && connected.some && connected.value.kind === "connected") {
        dispatch({ type: "draft", interaction: { kind: "draft", connection: connected.value, source, target: view.target } });
      }
      return;
    }
    if (next.target.kind === "edge") {
      return;
    }
    if (next.target.kind === "node") {
      if (next.moved) {
        finish(StateMachineSource.move(source, view.resolution, { name: next.target.name, point: StateMachineGesture.position(next) }));
      }
      return;
    }
    if (next.moved || lost) {
      return;
    }
    if (view.target.kind === "part" && view.target.part === "state") {
      const name = StateMachinePlacement.nextName(view.resolution);
      if (finish(StateMachineSource.place(source, view.resolution, next.origin))) {
        activation.current = StateMachineActivation.block();
        view.selectElement(StateMachineGraph.stateSelection(name));
      }
      return;
    }
    view.clearSelection();
  };
  const fit = () => {
    cancel();
    view.fit();
    dispatch({ type: "fit", frame: StateMachineLayout.frame(view.layout ?? { left: -100, top: -100, width: 0, height: 0 }) });
  };
  return {
    svgRef, layout, connection, draft, labelEdit,
    selectOnClick: (event: MouseEvent, selection: StateMachineGraphSelection) => {
      activation.current = StateMachineActivation.click(activation.current, event.detail);
      if (StateMachineActivation.canEdit(activation.current)) {
        view.selectElement(selection);
      }
    },
    editLabel: (event: MouseEvent, selection: StateMachineGraphSelection) => {
      event.preventDefault();
      event.stopPropagation();
      if (!StateMachineActivation.canEdit(activation.current) || active.current.some || draft.some) {
        return;
      }
      if (view.graph === null || view.layout === null || view.resolution === null || view.target.kind !== "element") {
        return;
      }
      if (view.target.selection.id !== selection.id) {
        return;
      }
      const edit = StateMachineLabelEdit.create({ graph: view.graph, layout: view.layout, resolution: view.resolution }, selection);
      if (edit.some) {
        dispatch({ type: "label", interaction: { kind: "label", edit: edit.value, source, target: view.target } });
      }
    },
    submitLabel: (name: string): Result<boolean, string> => {
      if (!labelEdit.some || view.resolution === null) {
        return Result.err("編集対象が変更されました。編集し直してください");
      }
      const result = StateMachineSource.rename(source, view.resolution, { selection: labelEdit.value.selection, name });
      if (Result.isErr(result)) {
        return result;
      }
      finish(result);
      view.selectElement(StateMachineLabelEdit.renamedSelection(labelEdit.value, name));
      svgRef.current?.focus();
      return Result.ok(true);
    },
    viewport: StateMachineLayout.viewport(state.frame, view.zoom),
    cancelLabel: () => {
      cancel();
      svgRef.current?.focus();
    },
    submitConnection: (event: string): Result<boolean, string> => {
      if (!draft.some || view.resolution === null) {
        return Result.err("接続対象が変更されました。接続し直してください");
      }
      const input = { from: draft.value.from, to: draft.value.to, event };
      const result = StateMachineSource.connect(source, view.resolution, input);
      if (Result.isErr(result)) {
        return result;
      }
      finish(result);
      view.selectElement(StateMachineGraph.transitionSelection(input));
      svgRef.current?.focus();
      return Result.ok(true);
    },
    error: state.error || view.placementError,
    viewBox: StateMachineLayout.viewBox(state.frame, view.zoom),
    placing: view.target.kind === "part" && view.target.part === "state",
    begin, move, commit, fit,
    cancel: (event: PointerEvent<SVGSVGElement>) => {
      if (active.current.some && active.current.value.pointerId === event.pointerId) {
        cancel();
      }
    },
    keyDown: (event: KeyboardEvent<SVGSVGElement>) => {
      if (event.nativeEvent.isComposing || EventTargetEx.isTextEntry(event.target)) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        cancel();
        view.clearSelection();
        svgRef.current?.focus();
        return;
      }
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (active.current.some || draft.some || labelEdit.some) {
        return;
      }
      if (view.target.kind !== "element" || view.resolution === null) {
        return;
      }
      if (finish(StateMachineSource.removeSelection(source, view.resolution, view.target.selection))) {
        view.clearSelection();
        // 削除される要素がフォーカス中でも、次のUndo/Redoをグラフで受ける。
        svgRef.current?.focus();
      }
    },
    arrange: () => {
      cancel();
      if (view.resolution !== null && finish(StateMachineSource.arrange(source, view.resolution))) {
        const arranged = StateMachineLayout.create(view.graph!);
        view.fit();
        dispatch({ type: "fit", frame: StateMachineLayout.frame(arranged) });
      }
    },
  };
}
