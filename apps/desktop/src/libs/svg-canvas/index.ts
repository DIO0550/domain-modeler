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

  /** 画面上の移動量をSVG座標の移動量へ変換する。 */
  delta(svg: SVGSVGElement, pixels: Point): Option<Point> {
    const origin = SvgCanvas.point(svg, { x: 0, y: 0 });
    const point = SvgCanvas.point(svg, pixels);

    if (!origin.some || !point.some) {
      return Option.none();
    }

    return Option.some({
      x: point.value.x - origin.value.x,
      y: point.value.y - origin.value.y,
    });
  },

  /** Reactのpassiveなwheel購読ではpreventDefaultできないため、要素で購読する。 */
  listenWheel(
    svg: SVGSVGElement,
    listener: (event: WheelEvent) => void,
  ): () => void {
    svg.addEventListener("wheel", listener, { passive: false });

    return () => svg.removeEventListener("wheel", listener);
  },

  /** 押した要素で捕捉し、click/dblclickの送信先を維持する。 */
  capture(
    svg: SVGSVGElement,
    pointerId: number,
    target: Element = svg,
  ): () => void {
    svg.focus();
    target.setPointerCapture?.(pointerId);

    return () => SvgCanvas.release(target, pointerId);
  },

  release(target: Element, pointerId: number): void {
    if (target.hasPointerCapture?.(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
  },
} as const;
