import { act } from "react";
import { canvasPointer, createStateMachineRenderer } from "./stateMachine.test-support";

export const connectionSource = "state-machine 注文 =\n  initial: 待機\n  state: 待機 // @canvas-position(v1, 200, 200)\n  state: 完了 terminal // @canvas-position(v1, 500, 200)";
export function connectionScreen(screens: ReturnType<typeof createStateMachineRenderer>, source = connectionSource) {
  const screen = screens.render(source);
  const canvas = canvasPointer(screen.host);
  screen.selectNode("待機");
  return {
    ...screen, canvas,
    begin: () => canvas.pointer("pointerdown", { x: 660, y: 440 }, screen.host.querySelector('[aria-label="待機 から接続 right"]')!),
    drop: () => canvas.pointer("pointerup", { x: 1000, y: 440 }),
    submitEvent: () => act(() => screen.host.querySelector('form[aria-label="新しい遷移のイベント名"]')!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))),
    enterConnectionEvent: (value: string) => screen.enterText("新しい遷移のイベント名", value),
    cancel: (reason: string) => {
      const cancellations: Record<string, () => void> = {
        blank: () => canvas.pointer("pointerup", { x: 1500, y: 700 }),
        escape: canvas.escape,
        pointercancel: () => canvas.pointer("pointercancel", { x: 1500, y: 700 }),
        lostpointercapture: () => canvas.pointer("lostpointercapture", { x: 0, y: 0 }),
      };
      cancellations[reason]!();
    },
  };
}
