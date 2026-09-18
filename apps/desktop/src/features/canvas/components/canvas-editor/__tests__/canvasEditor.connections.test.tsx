import { act } from "react";
import { expect, test } from "vitest";
import { ANCHORS, Viewport } from "@domain-modeler/canvas-core";
import {
  clickSurface,
  documentWithTwoStickies,
  renderEditor,
} from "./canvasEditor.test-support";

const pointer = (
  element: Element,
  type: string,
  point = { x: 270, y: 50 },
): void => {
  act(() => {
    element.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: point.x,
        clientY: point.y,
      }),
    );
  });
};

for (const anchor of Object.values(ANCHORS)) {
  test(`${anchor}のハンドルからドラッグすると要素を動かさず接続できる`, () => {
    const host = renderEditor(documentWithTwoStickies);
    clickSurface(host, { x: 50, y: 50 });
    expect(host.querySelectorAll("[data-connection-anchor]")).toHaveLength(4);
    const handle = host.querySelector(`[data-connection-anchor="${anchor}"]`);
    if (!(handle instanceof HTMLButtonElement)) {
      throw new Error("接続ハンドルがない");
    }
    // happy-dom の未実装のポインター捕捉境界のみ補う。
    handle.setPointerCapture = () => {};
    handle.releasePointerCapture = () => {};
    pointer(handle, "pointerdown");
    pointer(handle, "pointermove");
    expect(
      host.querySelector("[data-connection-preview]")?.getAttribute("d"),
    ).toMatch(/240 70$/);
    pointer(handle, "pointerup");
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
    const handle = host.querySelector('[data-connection-anchor="right"]');
    if (!(handle instanceof HTMLButtonElement)) {
      throw new Error("接続ハンドルがない");
    }
    handle.setPointerCapture = () => {};
    pointer(handle, "pointerdown");
    pointer(handle, "pointermove");
    pointer(handle, eventType);
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
  const handle = host.querySelector('[data-connection-anchor="right"]');
  if (!(handle instanceof HTMLButtonElement)) {
    throw new Error("接続ハンドルがない");
  }
  handle.setPointerCapture = () => {};
  handle.releasePointerCapture = () => {};
  const target = Viewport.worldToScreen(viewport, { x: 270, y: 50 });
  pointer(handle, "pointerdown");
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
  const handle = host.querySelector('[data-connection-anchor="right"]');
  if (!(handle instanceof HTMLButtonElement)) {
    throw new Error("接続ハンドルがない");
  }
  handle.setPointerCapture = () => {};
  pointer(handle, "pointerdown");
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

for (const cancelled of [false, true]) {
  test(`接続ドラッグ${cancelled ? "取消" : "終了"}後のclickとdblclickで付箋を配置せず、次の通常クリックでも配置しない`, () => {
    const host = renderEditor(documentWithTwoStickies);
    clickSurface(host, { x: 50, y: 50 });
    const handle = host.querySelector('[data-connection-anchor="right"]');
    if (!(handle instanceof HTMLButtonElement)) {
      throw new Error("接続ハンドルがない");
    }
    handle.setPointerCapture = () => {};
    handle.releasePointerCapture = () => {};
    pointer(handle, "pointerdown");
    pointer(handle, "pointermove", { x: 600, y: 400 });
    if (cancelled) {
      act(() => {
        handle.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      });
    }
    pointer(handle, "pointerup", { x: 600, y: 400 });
    const surface = host.querySelector(".canvas-surface");
    if (!(surface instanceof HTMLElement)) {
      throw new Error("キャンバスがない");
    }
    act(() => {
      surface.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          detail: 1,
          clientX: 600,
          clientY: 400,
        }),
      );
      surface.dispatchEvent(
        new MouseEvent("dblclick", {
          detail: 2,
          bubbles: true,
          clientX: 600,
          clientY: 400,
        }),
      );
    });
    expect(host.querySelectorAll("article")).toHaveLength(2);
    expect(host.querySelectorAll(".connection-layer__hit-area")).toHaveLength(
      0,
    );
    pointer(surface, "pointerdown", { x: 600, y: 400 });
    pointer(surface, "pointerup", { x: 600, y: 400 });
    clickSurface(host, { x: 600, y: 400 });
    expect(host.querySelectorAll("article")).toHaveLength(2);
  });
}
