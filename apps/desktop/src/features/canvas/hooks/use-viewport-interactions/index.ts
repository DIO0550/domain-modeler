import {
  useCallback,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import {
  Viewport,
  type Point,
  type Viewport as ViewportModel,
} from "@domain-modeler/canvas-core";

type ViewportChange = (current: ViewportModel) => ViewportModel;
type ChangeViewport = (change: ViewportChange) => void;

type PanningPointer =
  | Readonly<{ status: "idle" }>
  | Readonly<{
      status: "panning";
      pointerId: number;
      point: Point;
    }>;

/** CanvasSurface が viewport の DOM 操作を受け取るためのハンドラ。 */
export type ViewportSurfaceInteraction = Readonly<{
  isPanning: boolean;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onClickCapture: (event: MouseEvent<HTMLDivElement>) => void;
  onWheel: (event: WheelEvent<HTMLDivElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onKeyUp: (event: KeyboardEvent<HTMLDivElement>) => void;
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
}>;

/** viewport と座標変換、pan/zoom 操作。 */
export type UseViewportInteractionsResult = Readonly<{
  viewport: ViewportModel;
  toWorldPoint: (point: Point) => Point;
  panBy: (delta: Point) => void;
  zoomAt: (zoom: number, fixedPoint: Point) => void;
  reset: () => void;
  surfaceInteraction: ViewportSurfaceInteraction;
}>;

/**
 * viewport の pan/zoom と座標変換を扱う。
 *
 * @param viewport 現在の viewport。
 * @param changeViewport viewport の更新関数。
 * @returns 座標変換と CanvasSurface 用の操作。
 */
export function useViewportInteractions(
  viewport: ViewportModel,
  changeViewport: ChangeViewport,
): UseViewportInteractionsResult {
  const [isPanning, setIsPanning] = useState(false);
  const spacePressed = useRef(false);
  const panningPointer = useRef<PanningPointer>({ status: "idle" });
  const suppressClick = useRef(false);

  const panBy = useCallback(
    (delta: Point) => {
      changeViewport((current) => Viewport.pan(current, delta));
    },
    [changeViewport],
  );
  const zoomAt = useCallback(
    (zoom: number, fixedPoint: Point) => {
      changeViewport((current) => Viewport.zoomAt(current, zoom, fixedPoint));
    },
    [changeViewport],
  );
  const reset = useCallback(() => {
    changeViewport(() => Viewport.default());
  }, [changeViewport]);
  const stopPanning = useCallback((pointerId: number) => {
    if (
      panningPointer.current.status !== "panning" ||
      panningPointer.current.pointerId !== pointerId
    ) {
      return;
    }
    panningPointer.current = { status: "idle" };
    setIsPanning(false);
  }, []);

  return {
    viewport,
    toWorldPoint: (point) => Viewport.screenToWorld(viewport, point),
    panBy,
    zoomAt,
    reset,
    surfaceInteraction: {
      isPanning,
      onPointerDown: (event) => {
        const startsWithMiddleButton = event.button === 1;
        const startsWithSpace =
          event.button === 0 && spacePressed.current;
        if (!startsWithMiddleButton && !startsWithSpace) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        panningPointer.current = {
          status: "panning",
          pointerId: event.pointerId,
          point: { x: event.clientX, y: event.clientY },
        };
        suppressClick.current = startsWithSpace;
        setIsPanning(true);
      },
      onPointerMove: (event) => {
        const current = panningPointer.current;
        if (
          current.status !== "panning" ||
          current.pointerId !== event.pointerId
        ) {
          return;
        }
        const point = { x: event.clientX, y: event.clientY };
        panBy({
          x: point.x - current.point.x,
          y: point.y - current.point.y,
        });
        panningPointer.current = { ...current, point };
      },
      onPointerUp: (event) => {
        stopPanning(event.pointerId);
      },
      onPointerCancel: (event) => {
        suppressClick.current = false;
        stopPanning(event.pointerId);
      },
      onClickCapture: (event) => {
        if (!suppressClick.current) {
          return;
        }
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      },
      onWheel: (event) => {
        event.preventDefault();
        const delta = wheelDelta(event);
        if (event.ctrlKey || event.metaKey) {
          const rect = event.currentTarget.getBoundingClientRect();
          const fixedPoint = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };
          zoomAt(viewport.zoom * Math.exp(-delta.y * 0.002), fixedPoint);
          return;
        }
        panBy({ x: -delta.x, y: -delta.y });
      },
      onKeyDown: (event) => {
        if (isTextEntryEventTarget(event.target)) {
          return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "0") {
          event.preventDefault();
          reset();
          return;
        }
        if (event.code !== "Space") {
          return;
        }
        event.preventDefault();
        spacePressed.current = true;
      },
      onKeyUp: (event) => {
        if (event.code === "Space") {
          spacePressed.current = false;
        }
      },
      onBlur: () => {
        spacePressed.current = false;
      },
    },
  };
}

const wheelDelta = (event: WheelEvent<HTMLDivElement>): Point => {
  if (event.deltaMode === 1) {
    return { x: event.deltaX * 16, y: event.deltaY * 16 };
  }
  if (event.deltaMode === 2) {
    return {
      x: event.deltaX * event.currentTarget.clientWidth,
      y: event.deltaY * event.currentTarget.clientHeight,
    };
  }
  return { x: event.deltaX, y: event.deltaY };
};

const isTextEntryEventTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement;
