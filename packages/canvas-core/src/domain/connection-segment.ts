import type { Connection } from "./connection";
import type { Document } from "./document";
import { type Option, Option as OptionValue } from "./option";
import { type Point, Sticky } from "./sticky";

/** 接続線の始点と終点を表す。 */
export interface ConnectionSegment {
  readonly from: Point;
  readonly to: Point;
}

/** 接続線を生成し、当たり判定する関数群。 */
export const ConnectionSegment = {
  /**
   * 接続の明示アンカーまたは付箋間の方向から接続線を生成する。
   * @param document 接続元と接続先の付箋を含む文書。
   * @param connection 生成元の接続。
   * @returns 生成した接続線。付箋が存在しない場合、または自動アンカーを解決できない場合は値なし。
   */
  create: (
    document: Document,
    connection: Connection,
  ): Option<ConnectionSegment> => {
    const from = document.stickies.find(
      (sticky) => sticky.id === connection.from,
    );
    const to = document.stickies.find((sticky) => sticky.id === connection.to);
    if (from === undefined || to === undefined) {
      return OptionValue.none();
    }

    const fromCenter = Sticky.center(from);
    const toCenter = Sticky.center(to);
    const direction = {
      x: toCenter.x - fromCenter.x,
      y: toCenter.y - fromCenter.y,
    };
    const fromPoint = connection.fromAnchor === undefined
      ? Sticky.boundaryPoint(from, direction)
      : OptionValue.some(Sticky.anchorPoint(from, connection.fromAnchor));
    const toPoint = connection.toAnchor === undefined
      ? Sticky.boundaryPoint(to, { x: -direction.x, y: -direction.y })
      : OptionValue.some(Sticky.anchorPoint(to, connection.toAnchor));
    if (!fromPoint.some || !toPoint.some) {
      return OptionValue.none();
    }
    return OptionValue.some({ from: fromPoint.value, to: toPoint.value });
  },
  /**
   * ワールド座標と接続線の距離が許容値以内か判定する。
   * @param segment 判定対象の接続線。
   * @param point 判定するワールド座標。
   * @param tolerance ワールド座標系の許容距離。
   * @returns 接続線からの距離が許容値以内の場合は `true`。
   */
  contains: (
    segment: ConnectionSegment,
    point: Point,
    tolerance: number,
  ): boolean => ConnectionSegment.distanceFrom(segment, point) <= tolerance,
  /**
   * 点と接続線の最短距離を取得する。
   * @param segment 距離を測る接続線。
   * @param point 距離を測る点。
   * @returns 点と接続線の最短距離。
   */
  distanceFrom: (segment: ConnectionSegment, point: Point): number => {
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
};
