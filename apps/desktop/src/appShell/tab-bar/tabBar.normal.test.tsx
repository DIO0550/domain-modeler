import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { HistoryButton, type HistoryControlsValue } from "@/features/canvas";
import { TabBar } from "./index";
import { TabsState } from "../tabs";

type RenderedTabBar = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

const rendered: RenderedTabBar[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

const openCanvas = (): Extract<TabsState, { status: "active" }> =>
  TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  }) as Extract<TabsState, { status: "active" }>;

const renderTabBar = (
  historyControls?: HistoryControlsValue,
): HTMLDivElement => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);
  act(() => {
    root.render(
      <TabBar
        tabsState={openCanvas()}
        onActivate={() => {}}
        historyControls={historyControls}
      />,
    );
  });
  rendered.push({
    host,
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  });
  return host;
};

test("履歴操作は文書名と同じタイトル行に表示される", () => {
  const host = renderTabBar();

  expect(host.querySelector(".tab-bar__tabs")).not.toBeNull();
  expect(host.querySelector(".history-controls")).not.toBeNull();
  expect(host.querySelector('[aria-label="元に戻す"]')).not.toBeNull();
});

test("アクティブ文書の履歴状態をタイトル行へ反映する", () => {
  const host = renderTabBar({
    undo: HistoryButton.enabled(() => {}),
    redo: HistoryButton.disabled(),
  });

  expect(host.querySelector<HTMLButtonElement>('[aria-label="元に戻す"]')?.disabled).toBe(
    false,
  );
  expect(host.querySelector<HTMLButtonElement>('[aria-label="やり直す"]')?.disabled).toBe(
    true,
  );
});
