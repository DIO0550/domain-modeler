import { expect, test } from "vitest";
import { TabsState } from "./tabs";

test("最初の文書を開くとそのタブが追加されてアクティブになる", () => {
  const state = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });

  expect(state).toEqual({
    status: "active",
    activePath: "/documents/order.dcanvas",
    tabs: [
      {
        path: "/documents/order.dcanvas",
        documentType: "canvas",
        fileState: { status: "available" },
        backgroundChangeState: { status: "unchanged" },
      },
    ],
  });
});

test("異なるpathの文書を開くと複数のタブが開かれる", () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const second = TabsState.reducer(first, {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });

  expect(second.status).toBe("active");
  expect(second.tabs).toHaveLength(2);
  if (second.status === "active") {
    expect(second.activePath).toBe("/documents/order.dmodel");
  }
});

test("同じpathの文書を再び開くと重複せず既存タブがアクティブになる", () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const second = TabsState.reducer(first, {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const reopened = TabsState.reducer(second, {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });

  expect(reopened.tabs).toHaveLength(2);
  expect(reopened.status === "active" && reopened.activePath).toBe(
    "/documents/order.dcanvas",
  );
});

test("開いているタブを指定するとアクティブタブが切り替わる", () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const second = TabsState.reducer(first, {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const activated = TabsState.reducer(second, {
    type: "activateTab",
    path: "/documents/order.dcanvas",
  });

  expect(activated.status === "active" && activated.activePath).toBe(
    "/documents/order.dcanvas",
  );
});

test("ファイルが欠損してもpathと文書種別を保ったまま警告可能な状態になる", () => {
  const opened = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const missing = TabsState.reducer(opened, {
    type: "markFileMissing",
    path: "/documents/order.dcanvas",
  });

  expect(missing.tabs).toHaveLength(1);
  expect(missing.tabs[0]).toMatchObject({
    path: "/documents/order.dcanvas",
    documentType: "canvas",
    fileState: { status: "missing" },
  });
});

test("欠損したファイルが再作成されると利用可能な状態に戻る", () => {
  const opened = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const missing = TabsState.reducer(opened, {
    type: "markFileMissing",
    path: "/documents/order.dmodel",
  });
  const recreated = TabsState.reducer(missing, {
    type: "clearFileMissing",
    path: "/documents/order.dmodel",
  });

  expect(recreated.tabs[0]?.fileState).toEqual({ status: "available" });
});

test("背景タブに外部変更が取り込まれると変更マークが付く", () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const second = TabsState.reducer(first, {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const changed = TabsState.reducer(second, {
    type: "markBackgroundChanged",
    path: "/documents/order.dcanvas",
  });

  expect(changed.tabs[0]?.backgroundChangeState).toEqual({ status: "changed" });
  expect(changed.tabs[1]?.backgroundChangeState).toEqual({ status: "unchanged" });
});

test("変更マークが付いた背景タブをアクティブにするとマークが消える", () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const second = TabsState.reducer(first, {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const changed = TabsState.reducer(second, {
    type: "markBackgroundChanged",
    path: "/documents/order.dcanvas",
  });
  const activated = TabsState.reducer(changed, {
    type: "activateTab",
    path: "/documents/order.dcanvas",
  });

  expect(activated.tabs[0]?.backgroundChangeState).toEqual({
    status: "unchanged",
  });
});

test("操作を適用しても入力状態とそのタブを変更しない", () => {
  const opened = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const snapshot = structuredClone(opened);
  const next = TabsState.reducer(opened, {
    type: "markFileMissing",
    path: "/documents/order.dcanvas",
  });

  expect(opened).toEqual(snapshot);
  expect(next).not.toBe(opened);
  expect(next.tabs).not.toBe(opened.tabs);
  expect(next.tabs[0]).not.toBe(opened.tabs[0]);
});
