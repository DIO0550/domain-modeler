import { act } from "react";
import { createRoot } from "react-dom/client";
import { StateMachine } from "../index";

/** 文書更新を画面へ反映する、実物のステートマシン画面。 */
function renderStateMachine(initialSource: string) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let source = initialSource;
  const render = () => root.render(
    <StateMachine.Root value={source} onChange={replaceSource} onEditSource={() => undefined}>
      <StateMachine.Palette />
      <StateMachine.Graph />
      <StateMachine.Inspector />
    </StateMachine.Root>,
  );
  function replaceSource(next: string) {
    source = next;
    render();
  }
  act(render);
  return {
    host,
    source: () => source,
    replaceSource: (next: string) => act(() => replaceSource(next)),
    selectNode: (name: string) => act(() => {
      const node = [...host.querySelectorAll(".state-machine-screen__node")]
        .find((element) => element.querySelector("text")?.textContent === name);
      node!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }),
    openTransition: () => act(() => {
      const button = [...host.querySelectorAll(".state-machine-screen__palette button")]
        .find((element) => element.textContent === "遷移");
      button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }),
    select: (label: string) => host.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!,
    changeSelect: (select: HTMLSelectElement, value: string) => act(() => {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }),
    enterEvent: (event: string) => act(() => {
      const input = host.querySelector<HTMLInputElement>('input[aria-label="イベント名"]')!;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, event);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }),
    submit: () => act(() => host.querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))),
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

export function createStateMachineRenderer() {
  const screens: ReturnType<typeof renderStateMachine>[] = [];
  return {
    render(source: string) {
      const screen = renderStateMachine(source);
      screens.push(screen);
      return screen;
    },
    unmountAll: () => screens.splice(0).forEach((screen) => screen.unmount()),
  };
}
