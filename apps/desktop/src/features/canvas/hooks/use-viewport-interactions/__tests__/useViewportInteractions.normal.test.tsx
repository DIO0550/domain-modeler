import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import {
  Viewport,
  type Viewport as ViewportModel,
} from "@domain-modeler/canvas-core";
import {
  useViewportInteractions,
  type UseViewportInteractionsResult,
} from "../index";

type RenderedHook = Readonly<{
  latest: { current: UseViewportInteractionsResult | undefined };
  unmount: () => void;
}>;

const rendered: RenderedHook[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

const renderHook = (
  initialViewport: ViewportModel,
): { current: UseViewportInteractionsResult | undefined } => {
  const latest: { current: UseViewportInteractionsResult | undefined } = {
    current: undefined,
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  const Probe = () => {
    const [viewport, setViewport] = useState(initialViewport);
    latest.current = useViewportInteractions(viewport, (change) => {
      setViewport(change);
    });
    return null;
  };

  act(() => {
    root.render(<Probe />);
  });

  rendered.push({
    latest,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  });
  return latest;
};

test("pan はスクリーン座標の移動量を viewport へ加える", () => {
  const latest = renderHook({ x: 10, y: -20, zoom: 1.5 });

  act(() => {
    latest.current?.panBy({ x: 24, y: -8 });
  });

  expect(latest.current?.viewport).toEqual({ x: 34, y: -28, zoom: 1.5 });
});

test("zoom 前後でカーソル下のワールド座標を維持する", () => {
  const latest = renderHook({ x: 40, y: -16, zoom: 1 });
  const fixedPoint = { x: 240, y: 180 };
  const before = latest.current?.toWorldPoint(fixedPoint);

  act(() => {
    latest.current?.zoomAt(2, fixedPoint);
  });

  expect(latest.current?.toWorldPoint(fixedPoint)).toEqual(before);
  expect(latest.current?.viewport.zoom).toBe(2);
});

test("reset は viewport を既定値へ戻す", () => {
  const latest = renderHook({ x: 80, y: -40, zoom: 2 });

  act(() => {
    latest.current?.reset();
  });

  expect(latest.current?.viewport).toEqual(Viewport.default());
});
