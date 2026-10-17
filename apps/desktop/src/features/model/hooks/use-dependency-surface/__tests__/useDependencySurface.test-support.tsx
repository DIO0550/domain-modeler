import { act, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { Viewport, type Point } from "@domain-modeler/canvas-core";
import type { DiagramSurface } from "@/libs/diagram-surface";
import { useDependencySurface } from "..";

/** 図のDOM境界と実物の座標変換を接続する。 */
export function renderSurface() {
  const subscriptions = new Set<number>();
  const observeSurface: typeof DiagramSurface.observe = (_element, report) => {
    subscriptions.add(1);
    report({ width: 800, height: 600 });

    return () => {
      subscriptions.delete(1);
    };
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);

  function Probe() {
    const [viewport, setViewport] = useState(Viewport.default);
    const panBy = useCallback(
      (delta: Point) => setViewport((current) => Viewport.pan(current, delta)),
      [],
    );
    const zoomBy = useCallback(
      (factor: number, anchor: Point) =>
        setViewport((current) =>
          Viewport.zoomAt(current, current.zoom * factor, anchor),
        ),
      [],
    );
    const surface = useDependencySurface({ panBy, zoomBy, observeSurface });

    return (
      <section
        ref={surface.surfaceRef}
        {...surface.handlers}
        data-panning={surface.isPanning}
        data-viewport={JSON.stringify(viewport)}
      >
        <button type="button">モデル</button>
      </section>
    );
  }

  act(() => root.render(<Probe />));
  const element = host.querySelector("section")!;
  const captured = new Set<number>();
  element.setPointerCapture = (id) => {
    captured.add(id);
  };
  element.hasPointerCapture = (id) => captured.has(id);
  element.releasePointerCapture = (id) => {
    captured.delete(id);
  };

  return {
    element,
    captured,
    subscriptions,
    viewport: (): Viewport => JSON.parse(element.dataset.viewport!),
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

/** 実ポインターと同じbutton・pointerIdを保ってイベントを送る。 */
export function pointerEvent(
  element: Element,
  type: string,
  options: PointerEventInit = {},
) {
  act(() =>
    element.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        isPrimary: true,
        pointerId: 1,
        button: 0,
        ...options,
      }),
    ),
  );
}
