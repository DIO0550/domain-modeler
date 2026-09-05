import { useCallback, useEffect, useRef, type RefCallback } from "react";
import type { ViewportSurfaceInteraction } from "../use-viewport-interactions";

/**
 * CanvasSurface の要素参照と non-passive wheel listener を同期する。
 *
 * @param interaction viewport のDOM操作。
 * @returns CanvasSurfaceへ渡すcallback ref。
 */
export function useCanvasSurface(
  interaction: ViewportSurfaceInteraction | undefined,
): RefCallback<HTMLDivElement> {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const bindSurface = interaction?.bindSurface;
  const setSurfaceRef = useCallback(
    (surface: HTMLDivElement | null) => {
      surfaceRef.current = surface;
      bindSurface?.(surface);
    },
    [bindSurface],
  );

  useEffect(() => {
    const surface = surfaceRef.current;
    const onWheel = interaction?.onWheel;
    if (surface === null || onWheel === undefined) {
      return;
    }
    const handleWheel = (event: globalThis.WheelEvent): void => {
      onWheel(event, surface);
    };
    surface.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      surface.removeEventListener("wheel", handleWheel);
    };
  }, [interaction?.onWheel]);

  return setSurfaceRef;
}
