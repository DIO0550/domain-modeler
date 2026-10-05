import { act } from "react";
import { canvasPointer } from "./stateMachine.test-support";

/** レイアウトのないhappy-domで、viewBoxに追従するSVG行列だけを代替する。 */
export function viewportCanvas(host: HTMLElement) {
  const canvas = canvasPointer(host);
  const bounds = () => {
    const [left, top, width, height] = canvas.svg
      .getAttribute("viewBox")!
      .split(/\s+/)
      .map(Number);

    return { left: left!, top: top!, width: width!, height: height! };
  };
  const fitted = bounds();

  Object.defineProperties(canvas.svg, {
    clientWidth: { value: 1000 },
    clientHeight: { value: 800 },
  });

  Object.defineProperty(canvas.svg, "getScreenCTM", {
    configurable: true,
    value: () => {
      const visible = bounds();
      const scale = (2 * fitted.width) / visible.width;

      return {
        a: scale,
        d: scale,
        e: 100 - visible.left * scale,
        f: 40 - visible.top * scale,
      };
    },
  });

  return {
    ...canvas,
    fitted,
    bounds,
    zoom: () =>
      host.querySelector('output[aria-label="現在の倍率"]')!.textContent,
    button: (label: string) =>
      act(() =>
        [
          ...host.querySelectorAll<HTMLButtonElement>(
            ".state-machine-screen__zoom button",
          ),
        ]
          .find(
            (button) =>
              (button.getAttribute("aria-label") ?? button.textContent) ===
              label,
          )!
          .click(),
      ),
    wheel: (options: WheelEventInit, target: Element = canvas.svg) => {
      const event = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        clientX: 500,
        clientY: 300,
        ...options,
      });

      // happy-domのWheelEventは修飾キーの初期化を省略するため、ブラウザ境界だけ補う。
      Object.defineProperties(event, {
        ctrlKey: { value: options.ctrlKey ?? false },
        metaKey: { value: options.metaKey ?? false },
        clientX: { value: options.clientX ?? 500 },
        clientY: { value: options.clientY ?? 300 },
      });
      act(() => target.dispatchEvent(event));

      return event;
    },

    cancelGesture: (kind: "Escape" | "pointercancel") => {
      if (kind === "Escape") {
        canvas.escape();

        return;
      }

      canvas.pointer("pointercancel", { x: 480, y: 340 });
    },
  };
}
