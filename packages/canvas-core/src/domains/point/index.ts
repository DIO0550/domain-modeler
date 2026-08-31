/** ワールド座標上の点。 */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** 点に関する幾何計算。 */
export const Point = {
  /**
   * 点と線分の最短距離を取得する。
   * @param point 距離を測る点。
   * @param segment 始点と終点を持つ線分。
   * @returns 点と線分の最短距離。
   */
  distanceFromSegment: (
    point: Point,
    segment: Readonly<{ from: Point; to: Point }>,
  ): number => {
    const vector = {
      x: segment.to.x - segment.from.x,
      y: segment.to.y - segment.from.y,
    };
    const squaredLength = vector.x ** 2 + vector.y ** 2;
    if (squaredLength === 0) {
      return Math.hypot(point.x - segment.from.x, point.y - segment.from.y);
    }
    const projection = Math.min(
      1,
      Math.max(
        0,
        ((point.x - segment.from.x) * vector.x +
          (point.y - segment.from.y) * vector.y) /
          squaredLength,
      ),
    );
    return Math.hypot(
      point.x - (segment.from.x + projection * vector.x),
      point.y - (segment.from.y + projection * vector.y),
    );
  },
} as const;
