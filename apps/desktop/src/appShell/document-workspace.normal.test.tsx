import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { DocumentWorkspace } from "./document-workspace";
import { TabsState } from "./tabs";

type RenderedWorkspace = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

const rendered: RenderedWorkspace[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

/**
 * DocumentWorkspace を描画してホスト要素を返す。
 *
 * @param tabsState 表示するタブ状態。
 * @returns 描画先のホスト要素。
 */
const renderWorkspace = (tabsState: TabsState): HTMLDivElement => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  act(() => {
    root.render(<DocumentWorkspace tabsState={tabsState} />);
  });

  rendered.push({
    host,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  });
  return host;
};

test("キャンバス文書が前面のとき8種の付箋ボタンとズーム表示がある", () => {
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const host = renderWorkspace(tabsState);
  const captions = [
    "Domain Event",
    "Command",
    "Actor",
    "Aggregate",
    "Policy",
    "Read Model",
    "External System",
    "Hotspot",
  ];

  expect(
    captions.map((caption) =>
      Array.from(host.querySelectorAll("button")).some(
        (button) => button.getAttribute("aria-label") === caption,
      )
        ? caption
        : "",
    ),
  ).toEqual(captions);
  expect(host.querySelector('[aria-label="ズーム 100%"]')?.textContent).toBe(
    "100%",
  );
  expect(host.querySelector('[role="status"]')?.textContent).toBe("保存済み");
});

test("モデル文書が前面のときはキャンバスツールバーを出さない", () => {
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const host = renderWorkspace(tabsState);

  expect(host.querySelector('[aria-label="キャンバスツール"]')).toBeNull();
  expect(host.querySelector(".document-workspace__message")?.textContent).toBe(
    "ドメインモデル · order.dmodel",
  );
});
