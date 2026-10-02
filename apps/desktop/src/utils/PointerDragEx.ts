type ClientPoint = Readonly<{ clientX: number; clientY: number }>;

/** ポインタのドラッグ操作に対する汎用の変換と後始末。 */
export const PointerDragEx = {
  /**
   * 画面上の座標を SVG のユーザー座標へ変換する。
   *
   * @param svg 変換先の座標系を持つ SVG。
   * @param point 画面上の座標。
   * @returns SVG のユーザー座標。変換行列が無い環境では画面座標をそのまま返す。
   */
  toSvgPoint(svg: SVGSVGElement, point: ClientPoint): Readonly<{ x: number; y: number }> {
    const matrix = typeof svg.getScreenCTM === "function" ? svg.getScreenCTM() : null;
    if (matrix === null) {
      return { x: point.clientX, y: point.clientY };
    }
    const { a, b, c, d, e, f } = matrix.inverse();
    return { x: a * point.clientX + c * point.clientY + e, y: b * point.clientX + d * point.clientY + f };
  },
  /**
   * 画面上の 1px が SVG のユーザー座標でいくつに当たるかを返す。
   *
   * @param svg 対象の SVG。
   * @returns 1px あたりのユーザー座標の長さ。変換行列が無い環境では 1。
   */
  unitsPerPixel(svg: SVGSVGElement): number {
    const matrix = typeof svg.getScreenCTM === "function" ? svg.getScreenCTM() : null;
    return matrix === null || matrix.a === 0 ? 1 : 1 / matrix.a;
  },
  /** ドラッグ直後に発生するクリックを 1 回だけ打ち消す。 */
  suppressNextClick(): void {
    const suppress = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
    };
    window.addEventListener("click", suppress, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", suppress, { capture: true }), 0);
  },
} as const;
