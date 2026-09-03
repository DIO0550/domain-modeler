import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
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
  bindSurface: (surface: HTMLDivElement | null) => void;
  onWheel: (
    event: globalThis.WheelEvent,
    surface: HTMLDivElement,
  ) => void;
}>;

/** viewport と座標変換、pan/zoom 操作。 */
export type UseViewportInteractionsResult = Readonly<{
  viewport: ViewportModel;
  toWorldPoint: (point: Point) => Point;
  toWorldClientPoint: (point: Point) => Point;
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
  const surfaceElement = useRef<HTMLDivElement | null>(null);
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
  const stepZoom = useCallback(
    (factor: number) => {
      const surface = surfaceElement.current;
      if (surface === null) {
        return;
      }
      const rect = surface.getBoundingClientRect();
      const fixedPoint = { x: rect.width / 2, y: rect.height / 2 };
      changeViewport((current) =>
        Viewport.zoomAt(current, current.zoom * factor, fixedPoint),
      );
    },
    [changeViewport],
  );
  const bindSurface = useCallback((surface: HTMLDivElement | null) => {
    surfaceElement.current = surface;
  }, []);
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
  const handleWheel = useCallback(
    (event: globalThis.WheelEvent, surface: HTMLDivElement) => {
      if (isTextEntryEventTarget(event.target)) {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
        }
        return;
      }
      event.preventDefault();
      const delta = wheelDelta(event, surface);
      if (event.ctrlKey || event.metaKey) {
        const rect = surface.getBoundingClientRect();
        const fixedPoint = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        const factor = Math.exp(-delta.y * 0.002);
        changeViewport((current) =>
          Viewport.zoomAt(current, current.zoom * factor, fixedPoint),
        );
        return;
      }
      panBy({ x: -delta.x, y: -delta.y });
    },
    [changeViewport, panBy],
  );

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      const modified = event.ctrlKey || event.metaKey;
      if (modified && event.key === "0") {
        event.preventDefault();
        reset();
        return;
      }
      if (modified && (event.key === "=" || event.key === "+")) {
        event.preventDefault();
        stepZoom(1.2);
        return;
      }
      if (modified && event.key === "-") {
        event.preventDefault();
        stepZoom(1 / 1.2);
        return;
      }
      if (
        event.code !== "Space" ||
        isTextEntryEventTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      spacePressed.current = true;
    };
    const handleKeyUp = (event: globalThis.KeyboardEvent): void => {
      if (event.code === "Space") {
        spacePressed.current = false;
      }
    };
    const handleBlur = (): void => {
      spacePressed.current = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [reset, stepZoom]);

  return {
    viewport,
    toWorldPoint: (point) => Viewport.screenToWorld(viewport, point),
    toWorldClientPoint: (point) => {
      const rect = surfaceElement.current?.getBoundingClientRect();
      const localPoint =
        rect === undefined
          ? point
          : { x: point.x - rect.left, y: point.y - rect.top };
      return Viewport.screenToWorld(viewport, localPoint);
    },
    panBy,
    zoomAt,
    reset,
    surfaceInteraction: {
      isPanning,
      bindSurface,
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
      onWheel: handleWheel,
    },
  };
}

const wheelDelta = (
  event: globalThis.WheelEvent,
  surface: HTMLDivElement,
): Point => {
  if (event.deltaMode === 1) {
    return { x: event.deltaX * 16, y: event.deltaY * 16 };
  }
  if (event.deltaMode === 2) {
    return {
      x: event.deltaX * surface.clientWidth,
      y: event.deltaY * surface.clientHeight,
    };
  }
  return { x: event.deltaX, y: event.deltaY };
};

const isTextEntryEventTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement;
