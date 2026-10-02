import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Option, type Option as Optional } from "@/utils/Option";
import type { GraphPoint } from "../../domains/state-machine-layout";

/** ドラッグ中の接続線。 */
export type StateMachineConnectionDrag = Readonly<{
  from: string;
  start: GraphPoint;
  pointer: GraphPoint;
  over: Optional<string>;
}>;

type UseStateMachineConnectionParams = Readonly<{
  onConnect: (from: string, to: string) => void;
}>;

export type UseStateMachineConnectionResult = Readonly<{
  drag: Optional<StateMachineConnectionDrag>;
  /** 接続ハンドルの `pointerdown` から線を引き始める。 */
  start: (event: ReactPointerEvent<SVGElement>, from: string, start: GraphPoint) => void;
}>;

const NODE_ATTRIBUTE = "data-node-id";
const DRAG_THRESHOLD = 4;

const nodeIdAt = (target: EventTarget | null): Optional<string> => {
  if (!(target instanceof Element)) {
    return Option.none();
  }
  const id = target.closest(`[${NODE_ATTRIBUTE}]`)?.getAttribute(NODE_ATTRIBUTE);
  return id === null || id === undefined ? Option.none() : Option.some(id);
};

const graphPointOf = (svg: SVGSVGElement, event: Readonly<{ clientX: number; clientY: number }>): GraphPoint => {
  const matrix = typeof svg.getScreenCTM === "function" ? svg.getScreenCTM() : null;
  if (matrix === null) {
    return { x: event.clientX, y: event.clientY };
  }
  const { a, b, c, d, e, f } = matrix.inverse();
  return { x: a * event.clientX + c * event.clientY + e, y: b * event.clientX + d * event.clientY + f };
};

/** ドラッグ後に発生するクリックで、ドロップ先の要素が選択されないようにする。 */
const suppressNextClick = (): void => {
  const suppress = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };
  window.addEventListener("click", suppress, { capture: true, once: true });
  setTimeout(() => window.removeEventListener("click", suppress, { capture: true }), 0);
};

/**
 * 状態の接続ハンドルから別の状態へドラッグして遷移を指定する。
 * 状態以外でのドロップと Escape でキャンセルする。
 *
 * @param params 状態から状態へ線を引き終えたときの通知。引数はノードの識別子。
 * @returns ドラッグ中の線と開始操作。
 */
export function useStateMachineConnection({ onConnect }: UseStateMachineConnectionParams): UseStateMachineConnectionResult {
  const [drag, setDrag] = useState<Optional<StateMachineConnectionDrag & { svg: SVGSVGElement; moved: boolean }>>(Option.none());
  const active = drag.some ? drag.value : undefined;

  useEffect(() => {
    if (active === undefined) {
      return;
    }
    const move = (event: PointerEvent) => {
      const pointer = graphPointOf(active.svg, event);
      const moved = active.moved || Math.hypot(pointer.x - active.start.x, pointer.y - active.start.y) > DRAG_THRESHOLD;
      setDrag(Option.some({ ...active, pointer, moved, over: nodeIdAt(event.target) }));
    };
    const end = (event: PointerEvent) => {
      setDrag(Option.none());
      const over = nodeIdAt(event.target);
      if (!active.moved) {
        return;
      }
      suppressNextClick();
      if (!over.some) {
        return;
      }
      onConnect(active.from, over.value);
    };
    const cancel = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setDrag(Option.none());
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("keydown", cancel, { capture: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("keydown", cancel, { capture: true });
    };
  }, [active, onConnect]);

  return {
    drag: active === undefined
      ? Option.none()
      : Option.some({ from: active.from, start: active.start, pointer: active.pointer, over: active.over }),
    start: (event, from, start) => {
      const svg = event.currentTarget.ownerSVGElement;
      if (event.button !== 0 || svg === null) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setDrag(Option.some({ from, start, pointer: start, over: Option.none(), svg, moved: false }));
    },
  };
}
