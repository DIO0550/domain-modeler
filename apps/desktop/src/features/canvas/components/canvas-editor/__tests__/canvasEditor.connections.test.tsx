import { act } from "react";
import { expect, test } from "vitest";
import { ANCHORS, Viewport } from "@domain-modeler/canvas-core";
import {
  clickSurface,
  connectionHandleOf,
  documentWithTwoStickies,
  pointer,
  renderEditor,
  surfaceOf,
} from "./canvasEditor.test-support";

const DROP_POINT = { x: 270, y: 50 };
const EMPTY_POINT = { x: 600, y: 400 };

for (const anchor of Object.values(ANCHORS)) {
  test(`${anchor}のハンドルからドラッグすると要素を動かさず接続できる`, () => {
    const host = renderEditor(documentWithTwoStickies);
    clickSurface(host, { x: 50, y: 50 });
    expect(host.querySelectorAll("[data-connection-anchor]")).toHaveLength(4);
    const handle = connectionHandleOf(host, anchor);
    pointer(handle, "pointerdown", DROP_POINT);
    pointer(handle, "pointermove", DROP_POINT);
    expect(
      host.querySelector("[data-connection-preview]")?.getAttribute("d"),
    ).toMatch(/240 70$/);
    pointer(handle, "pointerup", DROP_POINT);
    expect(host.querySelector("[data-connection-preview]")).toBeNull();
    expect(host.querySelectorAll(".connection-layer__hit-area")).toHaveLength(
      1,
    );
    expect(host.querySelector("article")?.style.left).toBe("10px");
    expect(host.querySelectorAll("[data-connection-anchor]")).toHaveLength(4);
  });
}

for (const eventType of ["pointercancel", "lostpointercapture"]) {
  test(`${eventType}で接続プレビューを破棄する`, () => {
    const host = renderEditor(documentWithTwoStickies);
    clickSurface(host, { x: 50, y: 50 });
    const handle = connectionHandleOf(host, "right");
    pointer(handle, "pointerdown", DROP_POINT);
    pointer(handle, "pointermove", DROP_POINT);
    pointer(handle, eventType, DROP_POINT);
    expect(host.querySelector("[data-connection-preview]")).toBeNull();
    expect(host.querySelectorAll(".connection-layer__hit-area")).toHaveLength(
      0,
    );
  });
}

test("パン・ズーム後もポインター位置の要素へ接続できる", () => {
  const viewport = { x: 30, y: 40, zoom: 2 };
  const host = renderEditor({ ...documentWithTwoStickies, viewport });
  clickSurface(host, Viewport.worldToScreen(viewport, { x: 50, y: 50 }));
  const handle = connectionHandleOf(host, "right");
  const target = Viewport.worldToScreen(viewport, { x: 270, y: 50 });
  pointer(handle, "pointerdown", DROP_POINT);
  pointer(handle, "pointermove", target);
  expect(
    host.querySelector("[data-connection-preview]")?.getAttribute("d"),
  ).toMatch(/240 70$/);
  pointer(handle, "pointerup", target);
  expect(host.querySelectorAll(".connection-layer__hit-area")).toHaveLength(1);
});

test("接続先に近づくと候補の枠と固定接続点を表示し、離れると解除する", () => {
  const host = renderEditor(documentWithTwoStickies);
  clickSurface(host, { x: 50, y: 50 });
  const handle = connectionHandleOf(host, "right");
  pointer(handle, "pointerdown", DROP_POINT);
  pointer(handle, "pointermove", { x: 225, y: 70 });
  expect(
    host
      .querySelector('[data-connection-endpoint="target"]')
      ?.getAttribute("data-sticky-id"),
  ).toBe(documentWithTwoStickies.stickies[1].id);
  expect(
    host
      .querySelector(".sticky__connection-target")
      ?.getAttribute("data-connection-anchor"),
  ).toBe("left");
  expect(
    host.querySelector("[data-connection-preview]")?.getAttribute("d"),
  ).toMatch(/240 70$/);
  pointer(handle, "pointermove", { x: 600, y: 400 });
  expect(host.querySelector('[data-connection-endpoint="target"]')).toBeNull();
});

/** 右辺のハンドルから空白へ接続ドラッグを始める。 */
const beginDragToEmptySpace = (): Readonly<{
  host: HTMLDivElement;
  handle: HTMLButtonElement;
}> => {
  const host = renderEditor(documentWithTwoStickies);
  clickSurface(host, { x: 50, y: 50 });
  const handle = connectionHandleOf(host, "right");
  pointer(handle, "pointerdown", DROP_POINT);
  pointer(handle, "pointermove", EMPTY_POINT);
  return { host, handle };
};

/** 接続ドラッグの後始末で付箋が増えないことを検証する。 */
const expectNoPlacementAfterDrag = (host: HTMLDivElement): void => {
  const surface = surfaceOf(host);
  act(() => {
    surface.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        detail: 1,
        clientX: EMPTY_POINT.x,
        clientY: EMPTY_POINT.y,
      }),
    );
    surface.dispatchEvent(
      new MouseEvent("dblclick", {
        detail: 2,
        bubbles: true,
        clientX: EMPTY_POINT.x,
        clientY: EMPTY_POINT.y,
      }),
    );
  });
  expect(host.querySelectorAll("article")).toHaveLength(2);
  expect(host.querySelectorAll(".connection-layer__hit-area")).toHaveLength(0);
  pointer(surface, "pointerdown", EMPTY_POINT);
  pointer(surface, "pointerup", EMPTY_POINT);
  clickSurface(host, EMPTY_POINT);
  expect(host.querySelectorAll("article")).toHaveLength(2);
};

test("接続ドラッグ終了後のclickとdblclickで付箋を配置せず、次の通常クリックでも配置しない", () => {
  const { host, handle } = beginDragToEmptySpace();
  pointer(handle, "pointerup", EMPTY_POINT);
  expectNoPlacementAfterDrag(host);
});

test("接続ドラッグ取消後のclickとdblclickで付箋を配置せず、次の通常クリックでも配置しない", () => {
  const { host, handle } = beginDragToEmptySpace();
  act(() => {
    handle.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });
  pointer(handle, "pointerup", EMPTY_POINT);
  expectNoPlacementAfterDrag(host);
});
