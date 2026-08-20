import { TabsState, type TabsAction } from "./tabs";

/**
 * タブ UI の表示確認用状態。ファイルオープン実装後に App からの利用を外す。
 *
 * @returns active / background / missing と親ディレクトリ補足を含むタブ状態。
 */
export const createShowcaseTabsState = (): TabsState => {
  const opened: readonly TabsAction[] = [
    {
      type: "openTab",
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas",
    },
    {
      type: "openTab",
      path: "/Users/demo/warehouse/order.dcanvas",
      documentType: "canvas",
    },
    {
      type: "openTab",
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model",
    },
  ];
  const withTabs = opened.reduce(TabsState.reducer, TabsState.create());
  const missing = TabsState.reducer(withTabs, {
    type: "markFileMissing",
    path: "/Users/demo/shop/order.dmodel",
  });
  const changed = TabsState.reducer(missing, {
    type: "markBackgroundChanged",
    path: "/Users/demo/warehouse/order.dcanvas",
  });
  return TabsState.reducer(changed, {
    type: "activateTab",
    path: "/Users/demo/shop/order.dcanvas",
  });
};
