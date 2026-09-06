import { expect, test } from "vitest";
import { WheelEventEx } from "../WheelEventEx";

test.each([
  { deltaMode: WheelEvent.DOM_DELTA_PIXEL, expected: { x: 2, y: -3 } },
  { deltaMode: WheelEvent.DOM_DELTA_LINE, expected: { x: 32, y: -48 } },
  { deltaMode: WheelEvent.DOM_DELTA_PAGE, expected: { x: 1600, y: -1800 } },
])(
  "wheel の移動量をピクセルへ変換する",
  ({ deltaMode, expected }) => {
    const event = new WheelEvent("wheel", {
      deltaMode,
      deltaX: 2,
      deltaY: -3,
    });
    const page = document.createElement("div");
    Object.defineProperties(page, {
      clientWidth: { value: 800 },
      clientHeight: { value: 600 },
    });

    expect(WheelEventEx.toPixelDelta(event, page)).toEqual(expected);
  },
);
