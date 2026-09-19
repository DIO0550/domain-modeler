import {
  Connection,
  Sticky,
  Option,
  type Anchor,
  type Point,
  type StickyId,
} from "@domain-modeler/canvas-core";

/** 接続先の四辺中央のうち、始点との距離が最も短い固定端点。 */
export type ConnectionTarget = Readonly<{
  fromAnchor: Anchor;
  fromPoint: Point;
  fromOutwardNormal: Point;
  stickyId: StickyId;
  anchor: Anchor;
  point: Point;
  outwardNormal: Point;
}>;

/** 接続先の近接判定と固定端点への吸着。 */
export const ConnectionTarget = {
  /** 付箋内部または画面上24px以内の付箋を、前面から探索する。 */
  find(
    stickies: readonly Sticky[],
    sourceId: StickyId,
    pointer: Readonly<{ point: Point; zoom: number }>,
  ): Option<ConnectionTarget> {
    const margin = 24 / pointer.zoom;
    const sticky = [...stickies].reverse().find((candidate) => {
      if (candidate.id === sourceId) {
        return false;
      }
      const dx = Math.max(
        candidate.position.x - pointer.point.x,
        0,
        pointer.point.x - candidate.position.x - candidate.size.width,
      );
      const dy = Math.max(
        candidate.position.y - pointer.point.y,
        0,
        pointer.point.y - candidate.position.y - candidate.size.height,
      );
      return Math.hypot(dx, dy) <= margin;
    });
    const source = stickies.find((candidate) => candidate.id === sourceId);
    if (sticky === undefined || source === undefined) {
      return Option.none();
    }
    const { fromAnchor, toAnchor } = Connection.nearestAnchors({
      from: source,
      to: sticky,
    });
    const nearest = {
      fromAnchor,
      fromPoint: Sticky.anchorPoint(source, fromAnchor),
      anchor: toAnchor,
      point: Sticky.anchorPoint(sticky, toAnchor),
    };
    return Option.some({
      stickyId: sticky.id,
      ...nearest,
      fromOutwardNormal: Sticky.outwardNormal(source, nearest.fromPoint),
      outwardNormal: Sticky.outwardNormal(sticky, nearest.point),
    });
  },
} as const;
