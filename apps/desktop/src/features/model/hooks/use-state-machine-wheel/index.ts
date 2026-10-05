import { useEffect, type RefObject } from "react";
import { SvgCanvas } from "@/libs/svg-canvas";
import { EventTargetEx } from "@/utils/EventTargetEx";
import { WheelEventEx } from "@/utils/WheelEventEx";
import { StateMachineViewport } from "../../domains/state-machine-viewport";
import type { StateMachineLayout } from "../../domains/state-machine-layout";
import type { UseStateMachineViewResult } from "../use-state-machine-view";

type UseStateMachineWheelParams = Readonly<{
  svgRef: RefObject<SVGSVGElement | null>;
  frame: Pick<StateMachineLayout, "left" | "top" | "width" | "height">;
  view: UseStateMachineViewResult;
  isInteracting: () => boolean;
}>;

/**
 * ホイールのパンとCtrl/⌘付きのズームをSVG要素で購読する。
 * @param params 対象SVG、全体表示の範囲、表示操作と操作中の判定。
 * @returns なし。非表示・アンマウント時に購読を解除する。
 */
export function useStateMachineWheel({
  svgRef,
  frame,
  view,
  isInteracting,
}: UseStateMachineWheelParams): void {
  useEffect(() => {
    const svg = svgRef.current;

    if (svg === null) {
      return;
    }

    return SvgCanvas.listenWheel(svg, (event) => {
      if (EventTargetEx.isTextEntry(event.target)) {
        return;
      }

      event.preventDefault();

      if (isInteracting()) {
        return;
      }

      const pixels = WheelEventEx.toPixelDelta(event, svg);

      if (event.ctrlKey || event.metaKey) {
        const point = SvgCanvas.point(svg, {
          x: event.clientX,
          y: event.clientY,
        });

        if (point.some) {
          view.zoomBy(
            StateMachineViewport.wheelZoomFactor(pixels),
            StateMachineViewport.anchor(frame, point.value),
          );
        }

        return;
      }

      const delta = SvgCanvas.delta(svg, pixels);

      if (delta.some) {
        view.panBy(delta.value);
      }
    });
  }, [svgRef, frame, view, isInteracting]);
}
