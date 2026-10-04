import { act } from "react";
import { createRoot } from "react-dom/client";
import { StateMachine } from "../index";

/** 文書更新を画面へ反映する、実物のステートマシン画面。 */
function renderStateMachine(initialSource: string, initialMachineIndex = 0) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let source = initialSource;
  let selectedMachineIndex = initialMachineIndex;
  const render = () => root.render(
    <StateMachine.Root value={source} onChange={replaceSource} onEditSource={() => undefined}
      initialMachineIndex={initialMachineIndex} onMachineSelected={(index) => { selectedMachineIndex = index; }}>
      <StateMachine.Palette />
      <StateMachine.Graph />
      <StateMachine.Inspector />
    </StateMachine.Root>,
  );
  function replaceSource(next: string) {
    source = next;
    render();
  }
  const enterText = (label: string, value: string) => act(() => {
    const input = host.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const openPart = (label: string) => act(() => {
    const button = [...host.querySelectorAll(".state-machine-screen__palette button")]
      .find((element) => element.textContent === label);
    button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  act(render);
  return {
    host,
    source: () => source,
    selectedMachineIndex: () => selectedMachineIndex,
    enterText,
    clickInspectorButton: (label: string) => act(() => {
      const button = [...host.querySelectorAll<HTMLButtonElement>(".state-machine-screen__inspector button")]
        .find((element) => element.textContent === label);
      if (button === undefined) {
        throw new Error(`インスペクターにボタンがありません: ${label}`);
      }
      button.click();
    }),
    transitionLabels: (heading: string) => [...host.querySelectorAll(`ul[aria-label="${heading}"] button`)]
      .map((button) => button.textContent),
    openState: () => openPart("状態"),
    replaceSource: (next: string) => act(() => replaceSource(next)),
    selectNode: (name: string) => act(() => {
      const node = [...host.querySelectorAll(".state-machine-screen__node")]
        .find((element) => element.querySelector("text")?.textContent === name);
      node!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }),
    openTransition: () => openPart("遷移"),
    select: (label: string) => host.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!,
    changeSelect: (select: HTMLSelectElement, value: string) => act(() => {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }),
    enterEvent: (event: string) => enterText("イベント名", event),
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
    render(source: string, initialMachineIndex = 0) {
      const screen = renderStateMachine(source, initialMachineIndex);
      screens.push(screen);
      return screen;
    },
    unmountAll: () => screens.splice(0).forEach((screen) => screen.unmount()),
  };
}
