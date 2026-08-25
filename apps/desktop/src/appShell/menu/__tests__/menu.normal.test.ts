import { expect, test } from "vitest";
import { TabsState } from "../../tabs";
import { MenuState } from "..";

/**
 * 指定した文書を開いたタブ状態を返す。
 *
 * @param documents 開く文書。先頭から順に開く。
 * @returns 最後に開いた文書がアクティブなタブ状態。
 */
const openTabs = (
  ...documents: readonly Readonly<{
    path: string;
    documentType: "canvas" | "model";
  }>[]
): TabsState =>
  documents.reduce<TabsState>(
    (state, document) =>
      TabsState.reducer(state, {
        type: "openTab",
        path: document.path,
        documentType: document.documentType,
      }),
    TabsState.create(),
  );

test("文書が無いとき新規と開くだけが有効になる", () => {
  expect(MenuState.from(TabsState.create())).toEqual({
    newCanvas: "enabled",
    newModel: "enabled",
    open: "enabled",
    closeTab: "disabled",
    undo: "disabled",
    redo: "disabled",
    generateFromCanvas: "disabled",
  });
});

test.each([
  {
    documentType: "canvas" as const,
    generateFromCanvas: "enabled" as const,
  },
  {
    documentType: "model" as const,
    generateFromCanvas: "disabled" as const,
  },
])(
  "アクティブな文書が $documentType のとき生成は $generateFromCanvas になる",
  ({
    documentType,
    generateFromCanvas,
  }: {
    documentType: "canvas" | "model";
    generateFromCanvas: "enabled" | "disabled";
  }) => {
    const tabsState = openTabs({
      path: `/documents/order.d${documentType === "canvas" ? "canvas" : "model"}`,
      documentType,
    });

    expect(MenuState.from(tabsState)).toEqual({
      newCanvas: "enabled",
      newModel: "enabled",
      open: "enabled",
      closeTab: "enabled",
      undo: "enabled",
      redo: "enabled",
      generateFromCanvas,
    });
  },
);

test("モデルを前面にすると生成は無効になり、キャンバスを前面にすると有効になる", () => {
  const bothOpen = openTabs(
    { path: "/documents/order.dcanvas", documentType: "canvas" },
    { path: "/documents/order.dmodel", documentType: "model" },
  );
  const modelActive = TabsState.reducer(bothOpen, {
    type: "activateTab",
    path: "/documents/order.dmodel",
  });
  const canvasActive = TabsState.reducer(modelActive, {
    type: "activateTab",
    path: "/documents/order.dcanvas",
  });

  expect(MenuState.from(modelActive).generateFromCanvas).toBe("disabled");
  expect(MenuState.from(canvasActive).generateFromCanvas).toBe("enabled");
});
