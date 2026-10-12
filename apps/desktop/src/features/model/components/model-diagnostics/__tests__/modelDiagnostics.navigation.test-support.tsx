import { act } from "react";
import { createRoot } from "react-dom/client";
import { vi } from "vitest";
import { ModelDiagnostics } from "..";

/** 制御不能なDOM寸法だけを固定し、実エディタ・解析・画面切替を接続する。 */
export function renderDependencyNavigation(source: string) {
  const rect = vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(() => new DOMRect(0, 0, 280, 180));
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: string[] = [];
  const render = (value: string) =>
    act(() =>
      root.render(
        <ModelDiagnostics
          value={value}
          onChange={(next) => {
            changes.push(next);
            render(next);
          }}
        />,
      ),
    );
  const openDiagram = () =>
    act(() =>
      host
        .querySelectorAll<HTMLButtonElement>(
          'nav[aria-label="モデルの表示"] button',
        )[1]
        .click(),
    );

  render(source);
  openDiagram();

  return {
    host,
    changes,
    render,
    openDiagram,
    unmount: () => {
      act(() => root.unmount());
      host.remove();
      rect.mockRestore();
    },
  };
}

/** 指定した文字のインスペクターボタンを操作する。 */
export function clickInspector(host: HTMLElement, text: string) {
  const button = [
    ...host.querySelectorAll<HTMLButtonElement>("aside button"),
  ].find((item) => item.textContent === text)!;

  act(() => button.click());
}
