import { useReducer, useRef, type PointerEvent, type KeyboardEvent } from "react";
import { Result } from "@domain-modeler/model-core";
import { SvgCanvas } from "@/libs/svg-canvas";
import { Option } from "@/utils/Option";
import { StateMachineGesture } from "../../domains/state-machine-gesture";
import { StateMachineGraph } from "../../domains/state-machine-graph";
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
  gesture: Option<StateMachineGesture>;
  error: string;
  frame: ReturnType<typeof StateMachineLayout.frame>;
}>;
type CanvasAction =
  | Readonly<{ type: "gesture"; gesture: Option<StateMachineGesture> }>
  | Readonly<{ type: "finished"; error: string }>
  | Readonly<{ type: "fit"; frame: CanvasState["frame"] }>;

const reduceCanvas = (state: CanvasState, action: CanvasAction): CanvasState => {
  switch (action.type) {
    case "gesture":
      return { ...state, gesture: action.gesture, error: "" };
    case "finished":
      return { ...state, gesture: Option.none(), error: action.error };
    case "fit":
      return { ...state, frame: action.frame, gesture: Option.none() };
  }
};

/**
 * クリック配置・ドラッグの一時表示と確定を仲介する。文書への書き込みは確定時の1回だけ。
 * @param params 現在のマシン、全文と変更通知。
 * @returns 描画用の配置、固定された表示範囲、ポインター操作と自動整列。
 */
export function useStateMachineCanvas({ view, source, onChange }: UseStateMachineCanvasParams) {
  const svgRef = useRef<SVGSVGElement>(null);
  // 捕捉解除イベントがReactの再描画より先に来ても、二重確定しないための操作ハンドル。
  const active = useRef<Option<StateMachineGesture>>(Option.none());
  const [state, dispatch] = useReducer(reduceCanvas, view.layout, (layout): CanvasState => ({
    gesture: Option.none(), error: "",
    frame: StateMachineLayout.frame(layout ?? { left: -100, top: -100, width: 0, height: 0 }),
  }));
  const preview = StateMachineGesture.nodePosition(state.gesture, source);
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
    onChange(result.value);
    return true;
  };
  const cancel = () => {
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
    SvgCanvas.release(event.currentTarget, event.pointerId);
    dispatch({ type: "finished", error: "" });
    if (next.source !== source || view.resolution === null) {
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
    svgRef, layout,
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
      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
        view.clearSelection();
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
