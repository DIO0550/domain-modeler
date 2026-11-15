import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, assert } from "vitest";
import type { TabsState } from "../../tabs";
import { TabBar } from "..";

const cleanups: (() => void)[] = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup();
  }
});

export const renderTabBar = (tabsState: TabsState) => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const activatedPaths: string[] = [];

  act(() => {
    root.render(
      <TabBar
        tabsState={tabsState}
        onActivate={(path) => activatedPaths.push(path)}
      />,
    );
  });
  cleanups.push(() => {
    act(() => root.unmount());
    host.remove();
  });

  const tabList = host.querySelector('[role="tablist"]');
  assert(tabList instanceof HTMLDivElement);

  return { host, tabList, activatedPaths };
};

export const tabNamed = (host: HTMLElement, name: string) => {
  const tab = Array.from(host.querySelectorAll('[role="tab"]')).find(
    (element) => element.getAttribute("aria-label") === name,
  );
  assert(tab instanceof HTMLButtonElement, `タブ「${name}」が見つかる`);

  return tab;
};
