import type { Brand } from "./brand";
import { type Option, Option as OptionValue } from "./option";
import type { ValueOf } from "../types/value-of";

/** 付箋種別の列挙値。 */
export const STICKY_TYPES = {
  event: "event",
  actor: "actor",
  command: "command",
  policy: "policy",
  aggregate: "aggregate",
  readModel: "readModel",
  externalSystem: "externalSystem",
  hotspot: "hotspot",
} as const;

export type StickyType = ValueOf<typeof STICKY_TYPES>;

/** 付箋種別を判定する関数群。 */
export const StickyType = {
  /**
   * 値が既知の付箋種別か判定する。
   * @param value 判定する値。
   * @returns 既知の付箋種別の場合は `true`。
   */
  is: (value: unknown): value is StickyType =>
    typeof value === "string" && value in STICKY_TYPES,
} as const;

export type StickyId = Brand<string, "StickyId">;

export const StickyId = {
  /**
   * 永続化された文字列を付箋IDとして扱う。
   * @param raw 付箋IDとして扱う文字列。
   * @returns 付箋ID。
   */
  create: (raw: string): StickyId => raw as StickyId,
};

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** 座標に関する幾何計算。 */
export const Point = {
  /**
   * 座標と線分の最短距離を取得する。
   * @param point 距離を測る座標。
   * @param segment 始点と終点を持つ線分。
   * @returns 座標と線分の最短距離。
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

/** 付箋の接続点を表す辺の列挙値。 */
export const ANCHORS = {
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
} as const;

/** 付箋の接続点を表す辺。 */
export type Anchor = ValueOf<typeof ANCHORS>;

/** アンカーを判定する関数群。 */
export const Anchor = {
  /**
   * 値が既知のアンカーか判定する。
   * @param value 判定する値。
   * @returns 既知のアンカーの場合は `true`。
   */
  is: (value: unknown): value is Anchor =>
    typeof value === "string" && value in ANCHORS,
} as const;

export interface Size {
  readonly width: number;
  readonly height: number;
}

export const Size = {
  /**
   * 付箋のサイズが有効か判定する。
   * @param size 判定するサイズ。
   * @returns 幅と高さがともに正の場合は `true`。
   */
  isValid: (size: Size): boolean => size.width > 0 && size.height > 0,
};

export interface Sticky {
  readonly id: StickyId;
  readonly type: StickyType;
  readonly text: string;
  readonly position: Point;
  readonly size: Size;
}

export const Sticky = {
  /**
   * 指定された内容から付箋を生成する。
   * @param id 付箋ID。
   * @param type 付箋の種別。
   * @param text 付箋の本文。
   * @param position 付箋の位置。
   * @param size 付箋のサイズ。
   * @returns 指定内容で生成した付箋。
   */
  create: (
    id: StickyId,
    type: StickyType,
    text: string,
    position: Point,
    size: Size,
  ): Sticky => ({ id, type, text, position, size }),
  /**
   * ワールド座標が付箋の矩形内にあるか判定する。
   * @param sticky 判定対象の付箋。
   * @param point 判定するワールド座標。
   * @returns 座標が境界を含む付箋の矩形内にある場合は `true`。
   */
  contains: (sticky: Sticky, point: Point): boolean =>
    point.x >= sticky.position.x &&
    point.x <= sticky.position.x + sticky.size.width &&
    point.y >= sticky.position.y &&
    point.y <= sticky.position.y + sticky.size.height,
  /**
   * 付箋の中心座標を取得する。
   * @param sticky 中心を求める付箋。
   * @returns 付箋の中心座標。
   */
  center: (sticky: Sticky): Point => ({
    x: sticky.position.x + sticky.size.width / 2,
    y: sticky.position.y + sticky.size.height / 2,
  }),
  /**
   * 付箋の辺上にある座標から外向き法線を取得する。
   * @param sticky 辺を持つ付箋。
   * @param point 付箋の辺上にある座標。
   * @returns 座標がある辺から外向きの単位法線。
   */
  outwardNormal: (sticky: Sticky, point: Point): Point => {
    const center = Sticky.center(sticky);
    const horizontalRatio =
      Math.abs(point.x - center.x) / (sticky.size.width / 2);
    const verticalRatio =
      Math.abs(point.y - center.y) / (sticky.size.height / 2);
    if (horizontalRatio >= verticalRatio) {
      return { x: point.x < center.x ? -1 : 1, y: 0 };
    }
    return { x: 0, y: point.y < center.y ? -1 : 1 };
  },
  /**
   * 付箋のアンカー座標を取得する。
   * @param sticky アンカーを持つ付箋。
   * @param anchor 座標を求める辺。
   * @returns 指定した辺の中央座標。
   */
  anchorPoint: (sticky: Sticky, anchor: Anchor): Point => {
    const center = Sticky.center(sticky);
    const points = {
      top: { x: center.x, y: sticky.position.y },
      right: { x: sticky.position.x + sticky.size.width, y: center.y },
      bottom: { x: center.x, y: sticky.position.y + sticky.size.height },
      left: { x: sticky.position.x, y: center.y },
    } as const;
    return points[anchor];
  },
  /**
   * 付箋の中心から指定方向へ伸ばした直線と矩形の交点を取得する。
   * @param sticky 交点を求める付箋。
   * @param direction 中心から伸ばす方向ベクトル。
   * @returns 矩形の辺上の交点。方向ベクトルがゼロの場合は値なし。
   */
  boundaryPoint: (sticky: Sticky, direction: Point): Option<Point> => {
    if (direction.x === 0 && direction.y === 0) {
      return OptionValue.none();
    }
    const center = Sticky.center(sticky);
    const scale =
      1 /
      Math.max(
        Math.abs(direction.x) / (sticky.size.width / 2),
        Math.abs(direction.y) / (sticky.size.height / 2),
      );
    return OptionValue.some({
      x: center.x + direction.x * scale,
      y: center.y + direction.y * scale,
    });
  },
};
