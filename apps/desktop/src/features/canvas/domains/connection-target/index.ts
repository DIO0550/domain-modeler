import {
  ANCHORS,
  Sticky,
  Option,
  type Anchor,
  type Point,
  type StickyId,
} from "@domain-modeler/canvas-core";

/** 接続先の四辺中央のうち、ポインターに最も近い固定端点。 */
export type ConnectionTarget = Readonly<{
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
    if (sticky === undefined) {
      return Option.none();
    }
    const anchors = Object.values(ANCHORS).map((anchor) => ({
      anchor,
      point: Sticky.anchorPoint(sticky, anchor),
    }));
    const nearest = anchors.reduce((best, candidate) =>
      Math.hypot(
        candidate.point.x - pointer.point.x,
        candidate.point.y - pointer.point.y,
      ) <
      Math.hypot(best.point.x - pointer.point.x, best.point.y - pointer.point.y)
        ? candidate
        : best,
    );
    return Option.some({
      stickyId: sticky.id,
      ...nearest,
      outwardNormal: Sticky.outwardNormal(sticky, nearest.point),
    });
  },
} as const;
