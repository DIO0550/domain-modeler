import type { Point } from "@domain-modeler/canvas-core";

/** 画面座標での押下位置と現在位置。 */
export type PointerDrag = Readonly<{ origin: Point; point: Point }>;

/** クリック時の小さな手ぶれとドラッグを区別する。 */
export const PointerDrag = {
  /** 押下位置から画面上で4px以上動いたときだけドラッグを開始する。 */
  hasStarted({ origin, point }: PointerDrag): boolean {
    return Math.hypot(point.x - origin.x, point.y - origin.y) >= 4;
  },
} as const;
