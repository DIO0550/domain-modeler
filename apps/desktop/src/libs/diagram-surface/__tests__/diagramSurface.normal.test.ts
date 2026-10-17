import { afterEach, expect, test, vi } from "vitest";
import { DiagramSurface } from "..";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("表示領域が有効になった時点と寸法変更時に計測し、解除後は購読を残さない", () => {
  const subscriptions = new Set<() => void>();
  vi.stubGlobal("ResizeObserver", function (report: () => void) {
    return {
      observe: () => subscriptions.add(report),
      disconnect: () => subscriptions.delete(report),
    };
  });
  const element = document.createElement("section");
  let size = { width: 0, height: 0 };
  element.getBoundingClientRect = () => DOMRect.fromRect(size);
  const reports: Readonly<{ width: number; height: number }>[] = [];
  const stop = DiagramSurface.observe(element, (next) => reports.push(next));

  expect(reports).toEqual([]);
  size = { width: 800, height: 600 };
  subscriptions.forEach((report) => report());

  expect(reports).toEqual([size]);
  stop();
  expect(subscriptions.size).toBe(0);
});

test("要素の画面上の原点を引いてポインターのローカル座標を返す", () => {
  const element = document.createElement("section");
  element.getBoundingClientRect = () =>
    DOMRect.fromRect({ x: 30, y: 50, width: 800, height: 600 });

  expect(DiagramSurface.point(element, { x: 100, y: 130 })).toEqual({
    x: 70,
    y: 80,
  });
});

test("wheelの標準スクロールを抑止でき、解除後はイベントを受け取らない", () => {
  const element = document.createElement("section");
  const stop = DiagramSurface.listenWheel(element, (event) =>
    event.preventDefault(),
  );
  const first = new WheelEvent("wheel", { cancelable: true });
  element.dispatchEvent(first);
  stop();
  const second = new WheelEvent("wheel", { cancelable: true });
  element.dispatchEvent(second);

  expect(first.defaultPrevented).toBe(true);
  expect(second.defaultPrevented).toBe(false);
});

test("捕捉したポインターだけを解除する", () => {
  const element = document.createElement("section");
  const captured = new Set<number>();
  element.setPointerCapture = (id) => {
    captured.add(id);
  };
  element.hasPointerCapture = (id) => captured.has(id);
  element.releasePointerCapture = (id) => {
    captured.delete(id);
  };

  DiagramSurface.capture(element, 7);
  DiagramSurface.release(element, 8);
  expect(captured.has(7)).toBe(true);
  DiagramSurface.release(element, 7);
  expect(captured.size).toBe(0);
});

test("移動先へフォーカスする際に標準スクロールを要求しない", () => {
  const element = document.createElement("button");
  document.body.append(element);
  DiagramSurface.focus(element);

  expect(document.activeElement).toBe(element);
  element.remove();
});
