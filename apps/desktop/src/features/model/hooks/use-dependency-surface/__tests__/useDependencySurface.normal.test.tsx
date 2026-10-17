import { act } from "react";
import { diagramWheel } from "../../../components/dependency-view/__tests__/dependencyView.test-support";
import { expect, test } from "vitest";
import {
  pointerEvent,
  renderSurface,
} from "./useDependencySurface.test-support";

test("空白をドラッグするとパンし、直後のclickによる選択解除を抑止する", () => {
  const screen = renderSurface();
  pointerEvent(screen.element, "pointerdown", { clientX: 10, clientY: 20 });
  pointerEvent(screen.element, "pointermove", { clientX: 110, clientY: 70 });
  pointerEvent(screen.element, "pointerup");
  pointerEvent(screen.element, "lostpointercapture");
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  act(() => screen.element.dispatchEvent(click));

  expect(screen.viewport()).toEqual({ x: 100, y: 50, zoom: 1 });
  expect(click.defaultPrevented).toBe(true);
  expect(screen.element.dataset.panning).toBe("false");
  screen.unmount();
});

test("カード上のドラッグ・右ボタン・4px未満の手ぶれではパンしない", () => {
  const screen = renderSurface();
  pointerEvent(screen.element.querySelector("button")!, "pointerdown");
  pointerEvent(screen.element, "pointermove", { clientX: 100, clientY: 200 });
  pointerEvent(screen.element, "pointerdown", { button: 2 });
  pointerEvent(screen.element, "pointermove", { clientX: 100, clientY: 200 });
  pointerEvent(screen.element, "pointerdown", { clientX: 10, clientY: 20 });
  pointerEvent(screen.element, "pointermove", { clientX: 13, clientY: 20 });
  pointerEvent(screen.element, "pointerup");

  expect(screen.viewport()).toEqual({ x: 0, y: 0, zoom: 1 });
  screen.unmount();
});

test("通常wheelはパンし、Ctrl・⌘付きwheelはポインターを基準にズームする", () => {
  const screen = renderSurface();
  diagramWheel(screen.element, { deltaX: 20, deltaY: 40 });
  expect(screen.viewport()).toEqual({ x: -20, y: -40, zoom: 1 });
  diagramWheel(screen.element, {
    deltaY: -100,
    ctrlKey: true,
    clientX: 100,
    clientY: 200,
  });
  expect(screen.viewport().zoom).toBeGreaterThan(1);
  const zoom = screen.viewport().zoom;
  diagramWheel(screen.element, { deltaY: 100, metaKey: true });
  expect(screen.viewport().zoom).toBeLessThan(zoom);
  screen.unmount();
});

test.each([
  "pointercancel",
  "lostpointercapture",
])("捕捉終了後の移動ではパンを続けない: %s", (type) => {
  const screen = renderSurface();
  pointerEvent(screen.element, "pointerdown");
  pointerEvent(screen.element, "pointermove", { clientX: 100, clientY: 50 });
  pointerEvent(screen.element, type);
  pointerEvent(screen.element, "pointermove", { clientX: 200, clientY: 100 });

  expect(screen.viewport()).toEqual({ x: 100, y: 50, zoom: 1 });
  expect(screen.element.dataset.panning).toBe("false");
  screen.unmount();
});

test("非表示・アンマウントで寸法とwheel購読、ポインター捕捉を解除する", () => {
  const screen = renderSurface();
  pointerEvent(screen.element, "pointerdown");
  expect(screen.captured.size).toBe(1);
  screen.unmount();
  const wheel = new WheelEvent("wheel", { cancelable: true });
  screen.element.dispatchEvent(wheel);

  expect(wheel.defaultPrevented).toBe(false);
  expect(screen.captured.size).toBe(0);
  expect(screen.subscriptions.size).toBe(0);
});

test("パンが取り消された後も次のカード操作を受け付ける", () => {
  const screen = renderSurface();
  pointerEvent(screen.element, "pointerdown");
  pointerEvent(screen.element, "pointermove", { clientX: 100, clientY: 50 });
  pointerEvent(screen.element, "pointercancel");
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  act(() => screen.element.querySelector("button")!.dispatchEvent(click));

  expect(click.defaultPrevented).toBe(false);
  screen.unmount();
});
