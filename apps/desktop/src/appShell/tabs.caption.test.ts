import { expect, test } from "vitest";
import { type TabDocumentType, TabsState } from "./tabs";

type TabDocument = Readonly<{
  path: string;
  documentType: TabDocumentType;
}>;

const openTabs = (
  first: TabDocument,
  ...rest: readonly TabDocument[]
): Extract<TabsState, { status: "active" }> => {
  const documents = [first, ...rest];
  return documents.reduce<TabsState>(
    (current, document) =>
      TabsState.reducer(current, {
        type: "openTab",
        path: document.path,
        documentType: document.documentType,
      }),
    TabsState.create(),
  ) as Extract<TabsState, { status: "active" }>;
};

test("タブが無いときキャプションは空になる", () => {
  expect(TabsState.captions(TabsState.create())).toEqual([]);
});

test("ファイル名が異なるタブには親ディレクトリを添えない", () => {
  const state = openTabs(
    { path: "/documents/order.dcanvas", documentType: "canvas" },
    { path: "/documents/order.dmodel", documentType: "model" },
  );

  expect(TabsState.captions(state)).toEqual([
    {
      path: "/documents/order.dcanvas",
      fileName: "order.dcanvas",
      parentDirectorySupplement: { status: "hidden" },
    },
    {
      path: "/documents/order.dmodel",
      fileName: "order.dmodel",
      parentDirectorySupplement: { status: "hidden" },
    },
  ]);
});

test("同名ファイルのタブには直近の親ディレクトリを未変換のまま添える", () => {
  const state = openTabs(
    { path: "/Users/demo/shop/order.dcanvas", documentType: "canvas" },
    { path: "/Users/demo/warehouse/order.dcanvas", documentType: "canvas" },
  );

  expect(TabsState.captions(state)).toEqual([
    {
      path: "/Users/demo/shop/order.dcanvas",
      fileName: "order.dcanvas",
      parentDirectorySupplement: { status: "visible", directory: "shop" },
    },
    {
      path: "/Users/demo/warehouse/order.dcanvas",
      fileName: "order.dcanvas",
      parentDirectorySupplement: {
        status: "visible",
        directory: "warehouse",
      },
    },
  ]);
});

test("直近の親ディレクトリが同じ同名ファイルは区別できる階層まで添える", () => {
  const state = openTabs(
    {
      path: "/home/user/shop/docs/order.dcanvas",
      documentType: "canvas",
    },
    {
      path: "/home/user/warehouse/docs/order.dcanvas",
      documentType: "canvas",
    },
  );

  expect(TabsState.captions(state)).toEqual([
    {
      path: "/home/user/shop/docs/order.dcanvas",
      fileName: "order.dcanvas",
      parentDirectorySupplement: { status: "visible", directory: "shop/docs" },
    },
    {
      path: "/home/user/warehouse/docs/order.dcanvas",
      fileName: "order.dcanvas",
      parentDirectorySupplement: {
        status: "visible",
        directory: "warehouse/docs",
      },
    },
  ]);
});

test("Windows パスの親ディレクトリは区切り文字を変換せずに添える", () => {
  const state = openTabs(
    { path: "C:\\shop\\order.dmodel", documentType: "model" },
    { path: "C:\\warehouse\\order.dmodel", documentType: "model" },
  );

  expect(TabsState.captions(state)).toEqual([
    {
      path: "C:\\shop\\order.dmodel",
      fileName: "order.dmodel",
      parentDirectorySupplement: { status: "visible", directory: "shop" },
    },
    {
      path: "C:\\warehouse\\order.dmodel",
      fileName: "order.dmodel",
      parentDirectorySupplement: {
        status: "visible",
        directory: "warehouse",
      },
    },
  ]);
});

test("親ディレクトリが無い同名ファイルには親ディレクトリを添えない", () => {
  const state = openTabs(
    { path: "/order.dcanvas", documentType: "canvas" },
    { path: "/tmp/order.dcanvas", documentType: "canvas" },
  );

  expect(TabsState.captions(state)).toEqual([
    {
      path: "/order.dcanvas",
      fileName: "order.dcanvas",
      parentDirectorySupplement: { status: "hidden" },
    },
    {
      path: "/tmp/order.dcanvas",
      fileName: "order.dcanvas",
      parentDirectorySupplement: { status: "visible", directory: "tmp" },
    },
  ]);
});

test("パスを正規化せずセグメントをそのまま親ディレクトリ補足に使う", () => {
  const state = openTabs(
    { path: "/a/../b/order.dcanvas", documentType: "canvas" },
    { path: "/b/order.dcanvas", documentType: "canvas" },
  );

  expect(TabsState.captions(state)).toEqual([
    {
      path: "/a/../b/order.dcanvas",
      fileName: "order.dcanvas",
      parentDirectorySupplement: { status: "visible", directory: "../b" },
    },
    {
      path: "/b/order.dcanvas",
      fileName: "order.dcanvas",
      parentDirectorySupplement: { status: "visible", directory: "b" },
    },
  ]);
});

test("active 状態のとき activePath のタブを返す", () => {
  const state = openTabs(
    { path: "/documents/order.dcanvas", documentType: "canvas" },
    { path: "/documents/order.dmodel", documentType: "model" },
  );

  expect(TabsState.activeTab(state).path).toBe("/documents/order.dmodel");
});

test("表示項目は activePath のタブだけを active にする", () => {
  const state = openTabs(
    { path: "/documents/order.dcanvas", documentType: "canvas" },
    { path: "/documents/order.dmodel", documentType: "model" },
  );

  expect(TabsState.tabViews(state).map((view) => view.activation)).toEqual([
    "background",
    "active",
  ]);
});
