import type { Connection } from "./connection";
import type { Document } from "./document";
import { type Option, Option as OptionValue } from "./option";
import { type Point, Sticky } from "./sticky";
import { NumberEx } from "../utils/NumberEx";

/** ほぼ水平・垂直とみなすワールド座標上のずれ。 */
const STRAIGHT_ALIGNMENT_TOLERANCE = 4;
/** ベジェ曲線が付箋の辺から離れる最小・最大距離。 */
const MINIMUM_CONTROL_DISTANCE = 40;
const MAXIMUM_CONTROL_DISTANCE = 140;
/** SVG path の座標に残す小数桁数。 */
const SVG_COORDINATE_DECIMAL_PLACES = 3;

/** 接続線の始点・終点と、それぞれの辺からの外向き法線を表す。 */
export interface ConnectionSegment {
  readonly from: Point;
  readonly to: Point;
  readonly fromOutwardNormal: Point;
  readonly toOutwardNormal: Point;
}

/** 接続線を生成し、描画経路と当たり判定を求める関数群。 */
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
    return OptionValue.some({
      from: fromPoint.value,
      to: toPoint.value,
      fromOutwardNormal: Sticky.outwardNormal(from, fromPoint.value),
      toOutwardNormal: Sticky.outwardNormal(to, toPoint.value),
    });
  },
  /**
   * 2つの端点が向かい合い、ほぼ水平または垂直に結べるか判定する。
   * @param segment 判定対象の接続線。
   * @returns 直線で結べる場合は `true`。
   */
  isStraightRoute: (segment: ConnectionSegment): boolean => {
    const delta = {
      x: segment.to.x - segment.from.x,
      y: segment.to.y - segment.from.y,
    };
    const facesHorizontally =
      segment.fromOutwardNormal.x === -segment.toOutwardNormal.x &&
      segment.fromOutwardNormal.x * delta.x > 0 &&
      Math.abs(delta.y) <= STRAIGHT_ALIGNMENT_TOLERANCE;
    const facesVertically =
      segment.fromOutwardNormal.y === -segment.toOutwardNormal.y &&
      segment.fromOutwardNormal.y * delta.y > 0 &&
      Math.abs(delta.x) <= STRAIGHT_ALIGNMENT_TOLERANCE;
    return facesHorizontally || facesVertically;
  },
  /**
   * 接続線から直線のSVG経路を組み立てる。
   * @param segment 変換する接続線。
   * @returns SVGの直線経路と中点。
   */
  toStraightRoute: (segment: ConnectionSegment) => ({
    shape: "straight" as const,
    path: `M ${NumberEx.round(segment.from.x, SVG_COORDINATE_DECIMAL_PLACES)} ${NumberEx.round(segment.from.y, SVG_COORDINATE_DECIMAL_PLACES)} L ${NumberEx.round(segment.to.x, SVG_COORDINATE_DECIMAL_PLACES)} ${NumberEx.round(segment.to.y, SVG_COORDINATE_DECIMAL_PLACES)}`,
    midpoint: {
      x: (segment.from.x + segment.to.x) / 2,
      y: (segment.from.y + segment.to.y) / 2,
    },
  }),
  /**
   * 接続線から三次ベジェ曲線のSVG経路を組み立てる。
   * @param segment 変換する接続線。
   * @returns SVGの曲線経路と曲線上の中点。
   */
  toCurveRoute: (segment: ConnectionSegment) => {
    const endpointDistance = Math.hypot(
      segment.to.x - segment.from.x,
      segment.to.y - segment.from.y,
    );
    const controlDistance = Math.max(
      MINIMUM_CONTROL_DISTANCE,
      Math.min(MAXIMUM_CONTROL_DISTANCE, endpointDistance * 0.4),
    );
    const firstControl = {
      x: segment.from.x + segment.fromOutwardNormal.x * controlDistance,
      y: segment.from.y + segment.fromOutwardNormal.y * controlDistance,
    };
    const secondControl = {
      x: segment.to.x + segment.toOutwardNormal.x * controlDistance,
      y: segment.to.y + segment.toOutwardNormal.y * controlDistance,
    };
    const midpoint = {
      x:
        (segment.from.x +
          3 * firstControl.x +
          3 * secondControl.x +
          segment.to.x) /
        8,
      y:
        (segment.from.y +
          3 * firstControl.y +
          3 * secondControl.y +
          segment.to.y) /
        8,
    };
    return {
      shape: "curve" as const,
      path: `M ${NumberEx.round(segment.from.x, SVG_COORDINATE_DECIMAL_PLACES)} ${NumberEx.round(segment.from.y, SVG_COORDINATE_DECIMAL_PLACES)} C ${NumberEx.round(firstControl.x, SVG_COORDINATE_DECIMAL_PLACES)} ${NumberEx.round(firstControl.y, SVG_COORDINATE_DECIMAL_PLACES)}, ${NumberEx.round(secondControl.x, SVG_COORDINATE_DECIMAL_PLACES)} ${NumberEx.round(secondControl.y, SVG_COORDINATE_DECIMAL_PLACES)}, ${NumberEx.round(segment.to.x, SVG_COORDINATE_DECIMAL_PLACES)} ${NumberEx.round(segment.to.y, SVG_COORDINATE_DECIMAL_PLACES)}`,
      midpoint,
    };
  },
  /**
   * 接続線の向きに応じたSVG経路を組み立てる。
   * @param segment 変換する接続線。
   * @returns 直線または三次ベジェ曲線のSVG経路。
   */
  toRoute: (segment: ConnectionSegment) =>
    ConnectionSegment.isStraightRoute(segment)
      ? ConnectionSegment.toStraightRoute(segment)
      : ConnectionSegment.toCurveRoute(segment),
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
