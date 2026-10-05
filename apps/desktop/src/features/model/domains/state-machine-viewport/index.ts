import type { StateMachinePosition } from "../state-machine-position";
import { StateMachineLayout } from "../state-machine-layout";

type Frame = Pick<StateMachineLayout, "left" | "top" | "width" | "height">;

/** 全体表示を基準とした倍率と表示中心のずれ。文書へは保存しない。 */
export type StateMachineViewport = Readonly<{
  zoom: number;
  pan: StateMachinePosition;
}>;

export const StateMachineViewport = {
  create(): StateMachineViewport {
    return { zoom: 1, pan: { x: 0, y: 0 } };
  },

  panBy(
    viewport: StateMachineViewport,
    delta: StateMachinePosition,
  ): StateMachineViewport {
    return {
      ...viewport,
      pan: { x: viewport.pan.x + delta.x, y: viewport.pan.y + delta.y },
    };
  },

  /** anchorは全体表示の中心からの相対座標。省略時は現在の表示中心。 */
  zoomBy(
    viewport: StateMachineViewport,
    factor: number,
    anchor: StateMachinePosition = viewport.pan,
  ): StateMachineViewport {
    const zoom = Math.max(0.5, Math.min(3, viewport.zoom * factor));
    const ratio = viewport.zoom / zoom;

    return {
      zoom,
      pan: {
        x: anchor.x - (anchor.x - viewport.pan.x) * ratio,
        y: anchor.y - (anchor.y - viewport.pan.y) * ratio,
      },
    };
  },

  anchor(frame: Frame, point: StateMachinePosition): StateMachinePosition {
    return {
      x: point.x - frame.left - frame.width / 2,
      y: point.y - frame.top - frame.height / 2,
    };
  },

  wheelZoomFactor(delta: StateMachinePosition): number {
    return Math.exp(-delta.y * 0.002);
  },

  frame(viewport: StateMachineViewport, frame: Frame): Frame {
    const zoomed = StateMachineLayout.viewport(frame, viewport.zoom);

    return {
      ...zoomed,
      left: zoomed.left + viewport.pan.x,
      top: zoomed.top + viewport.pan.y,
    };
  },

  viewBox(viewport: StateMachineViewport, frame: Frame): string {
    const visible = StateMachineViewport.frame(viewport, frame);

    return `${visible.left} ${visible.top} ${visible.width} ${visible.height}`;
  },
} as const;
