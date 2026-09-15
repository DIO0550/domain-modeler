import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import type { AutoSaveOperations } from "@/features/auto-save";
import { DocumentWorkspace } from "./document-workspace";
import { TabsState } from "./tabs";

type RenderedWorkspace = Readonly<{
  host: HTMLDivElement;
  rerender: (tabsState: TabsState) => void;
  unmount: () => void;
}>;

const rendered: RenderedWorkspace[] = [];

afterEach(() => {
  vi.useRealTimers();
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

/**
 * DocumentWorkspace を描画してホスト要素を返す。
 *
 * @param tabsState 表示するタブ状態。
 * @returns 描画先と再描画。
 */
const renderWorkspace = (
  tabsState: TabsState,
  autoSaveOperations?: AutoSaveOperations,
): Pick<RenderedWorkspace, "host" | "rerender"> => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  const rerender = (next: TabsState): void => {
    act(() => {
      root.render(
        <DocumentWorkspace
          tabsState={next}
          autoSaveOperations={autoSaveOperations}
        />,
      );
    });
  };

  rerender(tabsState);

  rendered.push({
    host,
    rerender,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  });
  return { host, rerender };
};

/**
 * 指定した aria-label のボタンを返す。
 *
 * @param host 描画先。
 * @param name ボタンの名前。
 * @returns 該当するボタン。無ければ空のボタン。
 */
const buttonNamed = (host: HTMLDivElement, name: string): HTMLButtonElement => {
  const found = Array.from(host.querySelectorAll("section:not([hidden]) button")).find(
    (element) =>
      element.getAttribute("aria-label") === name || element.textContent === name,
  );
  return found instanceof HTMLButtonElement
    ? found
    : document.createElement("button");
};

test("キャンバス文書が前面のとき8種の付箋ボタンとズーム表示がある", () => {
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host } = renderWorkspace(tabsState);
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
      Array.from(host.querySelectorAll("section:not([hidden]) button")).some(
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
  const { host } = renderWorkspace(tabsState);

  expect(host.querySelector('[aria-label="キャンバスツール"]')).toBeNull();
  expect(host.querySelector('[aria-label="ドメインモデルのテキスト"]')).toBeInstanceOf(HTMLTextAreaElement);
});

test("モデルを変更直後に背景化しても自動保存を継続する", async () => {
  vi.useFakeTimers();
  const writes: Array<{ path: string; contents: string }> = [];
  const operations: AutoSaveOperations = {
    writeFile: async (path, contents) => {
      writes.push({ path, contents });
      return { type: "ok" };
    },
    now: Date.now,
  };
  const model = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const canvas = TabsState.reducer(model, {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host, rerender } = renderWorkspace(model, operations);
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "data Order = string");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });

  rerender(canvas);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });

  expect(writes).toEqual([
    { path: "/documents/order.dmodel", contents: "data Order = string" },
  ]);
});

test("背景のキャンバスは前面タブのSpaceパンを妨げず、切り替え後もビューポートを保持する", async () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab", path: "/first.dcanvas", documentType: "canvas",
  });
  const second = TabsState.reducer(first, {
    type: "openTab", path: "/second.dcanvas", documentType: "canvas",
  });
  const firstActive = TabsState.reducer(second, { type: "activateTab", path: "/first.dcanvas" });
  const { host, rerender } = renderWorkspace(first);
  await act(async () => rerender(second));
  const surface = host.querySelector<HTMLElement>("section:not([hidden]) .canvas-surface");
  expect(surface).not.toBeNull();
  await act(async () => {
    surface?.focus();
    document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", {
      bubbles: true, cancelable: true, key: " ", code: "Space",
    }));
    // 非背景の子要素上から開始するため、Spaceが届かない場合はパンしない。
    const child = document.createElement("span");
    surface?.append(child);
    child.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, button: 0, pointerId: 20, clientX: 100, clientY: 80,
    }));
  });
  expect(surface?.getAttribute("data-panning")).toBe("true");
  await act(async () => {
    surface?.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, button: 0, pointerId: 20, clientX: 132, clientY: 104,
    }));
  });
  expect(host.querySelector<HTMLElement>("section:not([hidden]) .canvas-world")?.style.transform).toBe("translate(32px, 24px) scale(1)");
  // キー・ポインターを押したまま切り替え、非表示中のkeyupも取りこぼさない。
  await act(async () => rerender(firstActive));
  await act(async () => window.dispatchEvent(new KeyboardEvent("keyup", { key: " ", code: "Space" })));
  await act(async () => rerender(second));
  expect(surface?.getAttribute("data-panning")).toBe("false");
  expect(host.querySelector<HTMLElement>("section:not([hidden]) .canvas-world")?.style.transform).toBe("translate(32px, 24px) scale(1)");
});

test("ドラッグ中に背景へ移した付箋は開始位置へ戻り復帰後に再操作できる", () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/first.dcanvas",
    documentType: "canvas",
  });
  const second = TabsState.reducer(first, {
    type: "openTab",
    path: "/second.dcanvas",
    documentType: "canvas",
  });
  const firstActive = TabsState.reducer(second, {
    type: "activateTab",
    path: "/first.dcanvas",
  });
  const { host, rerender } = renderWorkspace(first);
  const surface = host.querySelector<HTMLElement>(".canvas-surface");
  act(() => {
    surface?.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    host.querySelector<HTMLTextAreaElement>("textarea")?.blur();
  });
  const article = host.querySelector<HTMLElement>("article");
  const originalLeft = article?.style.left;
  const originalTop = article?.style.top;

  act(() => {
    article?.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 1,
        isPrimary: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    article?.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 1,
        isPrimary: true,
        clientX: 130,
        clientY: 130,
      }),
    );
  });
  expect(article?.style.left).not.toBe(originalLeft);

  rerender(second);
  rerender(firstActive);
  const restored = host.querySelector<HTMLElement>(
    "section:not([hidden]) article",
  );
  expect(restored?.style.left).toBe(originalLeft);
  expect(restored?.style.top).toBe(originalTop);

  act(() => {
    restored?.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 2,
        isPrimary: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    restored?.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 2,
        isPrimary: true,
        clientX: 120,
        clientY: 120,
      }),
    );
    restored?.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        pointerId: 2,
        isPrimary: true,
        clientX: 120,
        clientY: 120,
      }),
    );
  });

  expect(restored?.style.left).toBe(
    `${Number.parseFloat(originalLeft ?? "0") + 20}px`,
  );
  expect(restored?.style.top).toBe(
    `${Number.parseFloat(originalTop ?? "0") + 20}px`,
  );
});

test("キャンバス文書を切り替えると種別の選択は文書ごとに初期状態に戻る", () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const bothOpen = TabsState.reducer(first, {
    type: "openTab",
    path: "/documents/stock.dcanvas",
    documentType: "canvas",
  });
  const orderActive = TabsState.reducer(bothOpen, {
    type: "activateTab",
    path: "/documents/order.dcanvas",
  });
  const { host, rerender } = renderWorkspace(orderActive);

  act(() => {
    buttonNamed(host, "Command").click();
  });
  expect(buttonNamed(host, "Command").getAttribute("aria-pressed")).toBe("true");

  rerender(bothOpen);

  expect(buttonNamed(host, "Domain Event").getAttribute("aria-pressed")).toBe(
    "true",
  );
  expect(buttonNamed(host, "Command").getAttribute("aria-pressed")).toBe(
    "false",
  );
});
