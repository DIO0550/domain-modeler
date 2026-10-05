import { Option } from "@/utils/Option";

type Point = Readonly<{ x: number; y: number }>;

/** SVG の画面座標変換とポインター捕捉の境界。 */
export const SvgCanvas = {
  point(svg: SVGSVGElement, client: Point): Option<Point> {
    const matrix = svg.getScreenCTM?.();

    if (
      matrix === null ||
      matrix === undefined ||
      matrix.a === 0 ||
      matrix.d === 0
    ) {
      return Option.none();
    }

    // このキャンバスは回転・skewを使わず、viewBoxの平行移動と拡縮だけを持つ。
    return Option.some({
      x: (client.x - matrix.e) / matrix.a,
      y: (client.y - matrix.f) / matrix.d,
    });
  },

  capture(svg: SVGSVGElement, pointerId: number): void {
    svg.focus();
    svg.setPointerCapture?.(pointerId);
  },

  release(svg: SVGSVGElement, pointerId: number): void {
    if (svg.hasPointerCapture?.(pointerId)) {
      svg.releasePointerCapture(pointerId);
    }
  },
} as const;
