import { act } from "react";
import { expect, test } from "vitest";
import { TabsState } from "../../tabs";
import { renderTabBar, tabNamed } from "./tabBar.test-support";

test.each([
  {
    key: "ArrowRight",
    activePath: "/two/order.dmodel",
    expected: "/three/refund.dmodel",
  },
  {
    key: "ArrowLeft",
    activePath: "/two/order.dmodel",
    expected: "/one/order.dcanvas",
  },
  {
    key: "ArrowRight",
    activePath: "/three/refund.dmodel",
    expected: "/one/order.dcanvas",
  },
  {
    key: "ArrowLeft",
    activePath: "/one/order.dcanvas",
    expected: "/three/refund.dmodel",
  },
])("$activePath から $key で $expected を選択し、端では折り返す", ({
  key,
  activePath,
  expected,
}) => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/one/order.dcanvas",
    documentType: "canvas",
  });
  const second = TabsState.reducer(first, {
    type: "openTab",
    path: "/two/order.dmodel",
    documentType: "model",
  });
  const third = TabsState.reducer(second, {
    type: "openTab",
    path: "/three/refund.dmodel",
    documentType: "model",
  });
  const state = TabsState.reducer(third, {
    type: "activateTab",
    path: activePath,
  });
  const { tabList, activatedPaths } = renderTabBar(state);
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });

  act(() => tabList.dispatchEvent(event));

  expect(activatedPaths).toEqual([expected]);
  expect(event.defaultPrevented).toBe(true);
});

test("矢印以外のキーではタブを切り替えず、既定操作も妨げない", () => {
  const state = TabsState.reducer(TabsState.create(), {
    type: "newTab",
    documentType: "canvas",
  });
  const { tabList, activatedPaths } = renderTabBar(state);
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
  });

  act(() => tabList.dispatchEvent(event));

  expect(activatedPaths).toEqual([]);
  expect(event.defaultPrevented).toBe(false);
});

test("文書がないときは矢印キーでタブを選択しない", () => {
  const { host, tabList, activatedPaths } = renderTabBar(TabsState.create());
  const event = new KeyboardEvent("keydown", {
    key: "ArrowRight",
    bubbles: true,
    cancelable: true,
  });

  act(() => tabList.dispatchEvent(event));

  expect(host.querySelectorAll('[role="tab"]')).toHaveLength(0);
  expect(activatedPaths).toEqual([]);
  expect(event.defaultPrevented).toBe(false);
});

test("同名ファイルは親ディレクトリで区別し、クリックした文書を選択する", () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/one/order.dmodel",
    documentType: "model",
  });
  const state = TabsState.reducer(first, {
    type: "openTab",
    path: "/two/order.dmodel",
    documentType: "model",
  });
  const { host, activatedPaths } = renderTabBar(state);
  const firstTab = tabNamed(host, "ドメインモデル order.dmodel one");
  const secondTab = tabNamed(host, "ドメインモデル order.dmodel two");

  act(() => firstTab.click());

  expect(firstTab.getAttribute("aria-selected")).toBe("false");
  expect(secondTab.getAttribute("aria-selected")).toBe("true");
  expect(firstTab.querySelector(".tab-bar__parent")?.textContent).toBe("one");
  expect(activatedPaths).toEqual(["/one/order.dmodel"]);
});

test("欠損ファイルと背景で変更された文書には読み上げ可能な警告が付く", () => {
  const opened = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const background = TabsState.reducer(opened, {
    type: "newTab",
    documentType: "model",
  });
  const changed = TabsState.reducer(background, {
    type: "markBackgroundChanged",
    path: "/documents/order.dcanvas",
  });
  const state = TabsState.reducer(changed, {
    type: "markFileMissing",
    path: "/documents/order.dcanvas",
  });
  const { host } = renderTabBar(state);
  const tab = tabNamed(
    host,
    "キャンバス order.dcanvas ファイル欠損 未読の変更",
  );

  expect(tab.querySelector(".tab-bar__warning")).not.toBeNull();
  expect(tab.querySelector(".tab-bar__change-mark")).not.toBeNull();
  expect(tab.classList.contains("tab-bar__item--missing")).toBe(true);
});
