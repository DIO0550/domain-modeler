import { expect, test, vi } from "vitest";
import { PointerDragEx } from "../PointerDragEx";

const svgWith = (matrix: DOMMatrix | null): SVGSVGElement => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  Object.defineProperty(svg, "getScreenCTM", { value: () => matrix });
  return svg;
};

const scaled = (scale: number, x: number, y: number): DOMMatrix => {
  const inverse = { a: 1 / scale, b: 0, c: 0, d: 1 / scale, e: -x / scale, f: -y / scale };
  return { a: scale, inverse: () => inverse } as unknown as DOMMatrix;
};

test("画面座標を SVG の座標へ変換し、変換行列が無ければそのまま返す", () => {
  expect(PointerDragEx.toSvgPoint(svgWith(scaled(2, 10, 20)), { clientX: 30, clientY: 60 })).toEqual({ x: 10, y: 20 });
  expect(PointerDragEx.unitsPerPixel(svgWith(scaled(2, 0, 0)))).toBe(0.5);
  expect(PointerDragEx.toSvgPoint(svgWith(null), { clientX: 3, clientY: 4 })).toEqual({ x: 3, y: 4 });
  expect(PointerDragEx.unitsPerPixel(svgWith(null))).toBe(1);
});

test("直後のクリックを 1 回だけ打ち消す", () => {
  vi.useFakeTimers();
  const clicked = vi.fn();
  document.body.addEventListener("click", clicked);
  PointerDragEx.suppressNextClick();
  document.body.click();
  document.body.click();
  expect(clicked).toHaveBeenCalledTimes(1);
  PointerDragEx.suppressNextClick();
  vi.runAllTimers();
  document.body.click();
  expect(clicked).toHaveBeenCalledTimes(2);
  document.body.removeEventListener("click", clicked);
  vi.useRealTimers();
});
