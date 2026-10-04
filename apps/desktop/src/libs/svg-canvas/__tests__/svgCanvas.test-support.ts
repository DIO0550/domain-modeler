import { act } from "react";

/** happy-dom が持たないSVG行列・捕捉APIのみを代替する。文書操作は実物を通す。 */
export function canvasPointer(host: HTMLElement) {
  const svg = host.querySelector<SVGSVGElement>("svg.state-machine-screen__graph")!;
  Object.defineProperty(svg, "getScreenCTM", { configurable: true, value: () => ({ a: 2, d: 2, e: 100, f: 40 }) });
  const pointer = (type: string, point: Readonly<{ x: number; y: number }>, target: Element = svg) => act(() => {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, clientX: point.x, clientY: point.y }));
  });
  return {
    svg,
    pointer,
    click: (point: Readonly<{ x: number; y: number }>) => {
      pointer("pointerdown", point);
      pointer("pointerup", point);
      act(() => svg.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    },
    escape: () => act(() => svg.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))),
  };
}
