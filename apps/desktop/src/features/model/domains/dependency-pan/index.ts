import type { Point } from "@domain-modeler/canvas-core";

/** 画面上の押下位置を保持し、4px未満の手ぶれをクリックとして扱う。 */
export type DependencyPan =
  | Readonly<{ phase: "idle" }>
  | Readonly<{ phase: "pending" | "panning"; pointerId: number; point: Point }>;

export const DependencyPan = {
  create(): DependencyPan {
    return { phase: "idle" };
  },

  start(pointerId: number, point: Point): DependencyPan {
    return { phase: "pending", pointerId, point };
  },

  move(
    pan: DependencyPan,
    request: Readonly<{ pointerId: number; point: Point }>,
  ): Readonly<{ pan: DependencyPan; delta: Point }> {
    if (pan.phase === "idle" || pan.pointerId !== request.pointerId) {
      return { pan, delta: { x: 0, y: 0 } };
    }

    const delta = {
      x: request.point.x - pan.point.x,
      y: request.point.y - pan.point.y,
    };

    if (pan.phase === "pending" && Math.hypot(delta.x, delta.y) < 4) {
      return { pan, delta: { x: 0, y: 0 } };
    }

    return { pan: { ...pan, phase: "panning", point: request.point }, delta };
  },
} as const;
