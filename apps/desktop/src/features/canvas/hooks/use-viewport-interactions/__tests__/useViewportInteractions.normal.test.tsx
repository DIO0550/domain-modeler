import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import {
  Sticky,
  StickyId,
  STICKY_TYPES,
  type Sticky as StickyModel,
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
  stickies: readonly StickyModel[] = [],
): { current: UseViewportInteractionsResult | undefined } => {
  const latest: { current: UseViewportInteractionsResult | undefined } = {
    current: undefined,
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  const Probe = () => {
    const [viewport, setViewport] = useState(initialViewport);
    latest.current = useViewportInteractions(
      viewport,
      stickies,
      (change) => {
        setViewport(change);
      },
    );
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

const surfaceWithRect = (
  rect: Readonly<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>,
): HTMLDivElement => {
  const surface = document.createElement("div");
  surface.getBoundingClientRect = () => ({
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => ({}),
  });
  return surface;
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

test("全体表示は全付箋が収まる viewport へ変更する", () => {
  const stickies = [
    Sticky.create(
      StickyId.create("stk_left0000000"),
      STICKY_TYPES.event,
      "left",
      { x: -100, y: 50 },
      { width: 200, height: 100 },
    ),
    Sticky.create(
      StickyId.create("stk_right000000"),
      STICKY_TYPES.command,
      "right",
      { x: 300, y: 250 },
      { width: 100, height: 50 },
    ),
  ];
  const latest = renderHook({ x: 80, y: -40, zoom: 2 }, stickies);
  const surface = surfaceWithRect({
    left: 0,
    top: 0,
    width: 1000,
    height: 500,
  });
  act(() => {
    latest.current?.surfaceInteraction.bindSurface(surface);
  });

  act(() => {
    latest.current?.fitAll();
  });

  expect(latest.current?.viewport).toEqual({ x: 200, y: -100, zoom: 2 });
});

test("client 座標はキャンバス面を原点としてワールド座標へ変換する", () => {
  const latest = renderHook({ x: 10, y: 20, zoom: 2 });
  const surface = surfaceWithRect({
    left: 100,
    top: 50,
    width: 800,
    height: 600,
  });
  act(() => {
    latest.current?.surfaceInteraction.bindSurface(surface);
  });

  expect(latest.current?.toWorldClientPoint({ x: 150, y: 100 })).toEqual({
    x: 20,
    y: 15,
  });
});
