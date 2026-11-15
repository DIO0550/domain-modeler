import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, assert } from "vitest";
import { type MenuCommandId, MenuState } from "../../menu";
import type { TabsState } from "../../tabs";
import { MenuBar } from "..";

const cleanups: (() => void)[] = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup();
  }
});

export const renderMenuBar = (tabsState: TabsState) => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const commands: MenuCommandId[] = [];

  act(() => {
    root.render(
      <MenuBar
        menuState={MenuState.from(tabsState)}
        onCommand={(command) => commands.push(command)}
      />,
    );
  });
  cleanups.push(() => {
    act(() => root.unmount());
    host.remove();
  });

  return { host, commands };
};

export const menuItemNamed = (host: HTMLElement, name: string) => {
  const item = Array.from(host.querySelectorAll('[role="menuitem"]')).find(
    (element) => element.textContent === name,
  );
  assert(item instanceof HTMLButtonElement, `メニュー「${name}」が見つかる`);

  return item;
};
