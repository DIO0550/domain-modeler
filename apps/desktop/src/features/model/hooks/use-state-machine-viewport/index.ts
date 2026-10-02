import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { PointerDragEx } from "@/utils/PointerDragEx";
import { WheelEventEx } from "@/utils/WheelEventEx";
import type { GraphPoint } from "../../domains/state-machine-layout";

type UseStateMachineViewportParams = Readonly<{
  /** グラフ全体の中心(グラフ座標)。拡大縮小の基準点はここからの相対座標で通知する。 */
  center: GraphPoint;
  onPan: (delta: GraphPoint) => void;
  onZoom: (factor: number, anchor: GraphPoint) => void;
}>;

export type UseStateMachineViewportResult = Readonly<{
  /** 表示領域の SVG に渡す ref。 */
  ref: (svg: SVGSVGElement | null) => void;
  panning: boolean;
  /** 表示領域の `pointerdown` から、空白部分のドラッグによるパンを始める。 */
  startPan: (event: ReactPointerEvent<SVGSVGElement>) => void;
}>;

type PanDrag = Readonly<{ svg: SVGSVGElement; start: GraphPoint; last: GraphPoint; moved: boolean }>;

const DRAG_THRESHOLD = 4;
const ZOOM_SPEED = 0.0015;

/**
 * グラフ表示領域のパンとホイール操作を扱う。
 * Ctrl / ⌘ + ホイールはポインタ位置を基準に拡大縮小し、修飾キーなしのホイールはパンにする。
 *
 * @param params グラフ全体の中心と、パン・拡大縮小の通知。
 * @returns SVG に渡す ref、パン中かどうか、パンの開始操作。
 */
export function useStateMachineViewport({ center, onPan, onZoom }: UseStateMachineViewportParams): UseStateMachineViewportResult {
  const [svg, setSvg] = useState<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<PanDrag | null>(null);
  const latest = useRef({ center, onPan, onZoom });
  latest.current = { center, onPan, onZoom };

  useEffect(() => {
    if (svg === null) {
      return;
    }
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = WheelEventEx.toPixelDelta(event, svg);
      if (event.ctrlKey || event.metaKey) {
        const point = PointerDragEx.toSvgPoint(svg, event);
        const { center: middle } = latest.current;
        latest.current.onZoom(Math.exp(-delta.y * ZOOM_SPEED), { x: point.x - middle.x, y: point.y - middle.y });
        return;
      }
      const scale = PointerDragEx.unitsPerPixel(svg);
      latest.current.onPan({ x: delta.x * scale, y: delta.y * scale });
    };
    svg.addEventListener("wheel", wheel, { passive: false });
    return () => svg.removeEventListener("wheel", wheel);
  }, [svg]);

  useEffect(() => {
    if (drag === null) {
      return;
    }
    const move = (event: PointerEvent) => {
      const point = { x: event.clientX, y: event.clientY };
      const moved = drag.moved || Math.hypot(point.x - drag.start.x, point.y - drag.start.y) > DRAG_THRESHOLD;
      if (moved) {
        const scale = PointerDragEx.unitsPerPixel(drag.svg);
        latest.current.onPan({ x: (drag.last.x - point.x) * scale, y: (drag.last.y - point.y) * scale });
      }
      setDrag({ ...drag, last: moved ? point : drag.last, moved });
    };
    const end = () => {
      if (drag.moved) {
        PointerDragEx.suppressNextClick();
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
  }, [drag]);

  return {
    ref: setSvg,
    panning: drag?.moved === true,
    startPan: (event) => {
      if (event.button !== 0 || (event.target instanceof Element && event.target.closest('[role="button"]') !== null)) {
        return;
      }
      const point = { x: event.clientX, y: event.clientY };
      setDrag({ svg: event.currentTarget, start: point, last: point, moved: false });
    },
  };
}
