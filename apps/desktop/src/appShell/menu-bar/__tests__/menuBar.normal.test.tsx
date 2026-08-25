import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { MenuState } from "../../menu";
import { TabsState } from "../../tabs";
import { MenuBar } from "../index";

type RenderedMenuBar = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

const rendered: RenderedMenuBar[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

/**
 * MenuBar を描画し、生成メニューを開いた状態にする。
 *
 * @param tabsState メニュー有効状態の元になるタブ状態。
 * @returns 描画先のホスト要素。
 */
const renderMenuBarWithGenerateOpen = (tabsState: TabsState): HTMLDivElement => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  act(() => {
    root.render(
      <MenuBar menuState={MenuState.from(tabsState)} onCommand={() => undefined} />,
    );
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

  const generateButton = menuItemNamed(host, "生成");
  act(() => {
    generateButton.click();
  });
  return host;
};

/**
 * 指定した表示名の menuitem を返す。
 *
 * @param host 描画先。
 * @param name メニュー項目の表示名。
 * @returns 該当するボタン。無ければ空のボタン。
 */
const menuItemNamed = (host: HTMLDivElement, name: string): HTMLButtonElement => {
  const found = Array.from(host.querySelectorAll('[role="menuitem"]')).find(
    (element) => element.textContent === name,
  );
  return found instanceof HTMLButtonElement ? found : document.createElement("button");
};

test.each([
  {
    documentType: "canvas" as const,
    path: "/documents/order.dcanvas",
    ariaDisabled: "false",
  },
  {
    documentType: "model" as const,
    path: "/documents/order.dmodel",
    ariaDisabled: "true",
  },
])(
  "アクティブな文書が $documentType のとき生成コマンドの aria-disabled は $ariaDisabled になる",
  ({
    documentType,
    path,
    ariaDisabled,
  }: {
    documentType: "canvas" | "model";
    path: string;
    ariaDisabled: string;
  }) => {
    const tabsState = TabsState.reducer(TabsState.create(), {
      type: "openTab",
      path,
      documentType,
    });
    const host = renderMenuBarWithGenerateOpen(tabsState);

    expect(
      menuItemNamed(host, "キャンバスからドメインモデルを生成").getAttribute(
        "aria-disabled",
      ),
    ).toBe(ariaDisabled);
  },
);
