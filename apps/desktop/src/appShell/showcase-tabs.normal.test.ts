import { expect, test } from "vitest";
import { createShowcaseTabsState } from "./showcase-tabs";
import { TabsState } from "./tabs";

test("表示確認用状態は active・背景変更・欠損を同時に持つ", () => {
  const state = createShowcaseTabsState();
  const views = TabsState.tabViews(state);

  expect(views.map((view) => ({
    path: view.tab.path,
    activation: view.activation,
    fileState: view.tab.fileState,
    backgroundChangeState: view.tab.backgroundChangeState,
    parentDirectorySupplement: view.caption.parentDirectorySupplement,
  }))).toEqual([
    {
      path: "/Users/demo/shop/order.dcanvas",
      activation: "active",
      fileState: { status: "available" },
      backgroundChangeState: { status: "unchanged" },
      parentDirectorySupplement: { status: "visible", directory: "shop" },
    },
    {
      path: "/Users/demo/warehouse/order.dcanvas",
      activation: "background",
      fileState: { status: "available" },
      backgroundChangeState: { status: "changed" },
      parentDirectorySupplement: {
        status: "visible",
        directory: "warehouse",
      },
    },
    {
      path: "/Users/demo/shop/order.dmodel",
      activation: "background",
      fileState: { status: "missing" },
      backgroundChangeState: { status: "unchanged" },
      parentDirectorySupplement: { status: "hidden" },
    },
  ]);
});
