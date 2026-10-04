import { act } from "react";
import { canvasPointer, createStateMachineRenderer } from "./stateMachine.test-support";

export const inlineSource = `state-machine 注文 =
  initial: 待機
  state: 待機 // 説明 @canvas-position(v1, 200, 200)
  state: 完了 terminal // @canvas-position(v1, 500, 200)
  transition: 待機 -> 完了 on 確定 // 遷移コメント`;

export function inlineScreen(screens: ReturnType<typeof createStateMachineRenderer>, source = inlineSource) {
  const screen = screens.render(source);
  const canvas = canvasPointer(screen.host);
  const elementNamed = (kind: "node" | "edge", name: string) => [...screen.host.querySelectorAll(`.state-machine-screen__${kind}`)]
    .find((element) => element.querySelector("text")?.textContent === name)!;
  const click = (element: Element, detail: number) => {
    const text = element.querySelector("text")!;
    const point = { x: Number(text.getAttribute("x")) * 2 + 100, y: Number(text.getAttribute("y")) * 2 + 40 };
    canvas.pointer("pointerdown", point, element);
    canvas.pointer("pointerup", point);
    act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true, detail })));
  };
  const doubleClick = (element: Element) => {
    click(element, 1);
    click(element, 2);
    act(() => element.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, detail: 2 })));
  };
  return {
    ...screen, canvas, click, doubleClick,
    node: (name: string) => elementNamed("node", name),
    edge: (event: string) => elementNamed("edge", event),
    editState: (name: string) => doubleClick(elementNamed("node", name)),
    editEvent: (event: string) => doubleClick(elementNamed("edge", event)),
    enterName: (value: string) => screen.enterText(screen.host.querySelector<HTMLInputElement>(".state-machine-screen__label-editor input")!.getAttribute("aria-label")!, value),
    input: () => screen.host.querySelector<HTMLInputElement>(".state-machine-screen__label-editor input"),
    confirm: () => act(() => screen.host.querySelector(".state-machine-screen__label-editor form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))),
    key: (key: string, isComposing = false) => act(() => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key, isComposing, bubbles: true, cancelable: true }))),
  };
}
