import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { CanvasView, type HistoryButton } from "../index";

type RenderedCanvasView = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

const rendered: RenderedCanvasView[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

const disabledHistory: HistoryButton = { availability: "disabled" };

/**
 * CanvasView を描画してホスト要素を返す。
 *
 * @param props ズーム、保存状態、履歴ボタン。
 * @returns 描画先のホスト要素。
 */
const renderCanvasView = (props: {
  zoom?: number;
  saveStatus?: "saved" | "saving" | "failed";
  undo?: HistoryButton;
  redo?: HistoryButton;
  children?: ReactNode;
}): HTMLDivElement => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  act(() => {
    root.render(
      <CanvasView
        zoom={props.zoom ?? 1}
        saveStatus={props.saveStatus ?? "saved"}
        undo={props.undo ?? disabledHistory}
        redo={props.redo ?? disabledHistory}
      >
        {props.children}
      </CanvasView>,
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
  return host;
};

/**
 * 指定した aria-label のボタンを返す。
 *
 * @param host 描画先。
 * @param name ボタンの名前。
 * @returns 該当するボタン。無ければ空のボタン。
 */
const buttonNamed = (host: HTMLDivElement, name: string): HTMLButtonElement => {
  const found = Array.from(host.querySelectorAll("button")).find(
    (element) =>
      element.getAttribute("aria-label") === name || element.textContent === name,
  );
  return found instanceof HTMLButtonElement
    ? found
    : document.createElement("button");
};

test("付箋種別ボタンが8種すべて表示される", () => {
  const host = renderCanvasView({});
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
    captions.map((caption) => buttonNamed(host, caption).getAttribute("aria-label")),
  ).toEqual(captions);
});

test("初期状態のズーム表示は 100% になる", () => {
  const host = renderCanvasView({ zoom: 1 });

  expect(host.querySelector('[aria-label="ズーム 100%"]')?.textContent).toBe(
    "100%",
  );
});

test("保存済みのときは保存済みと表示する", () => {
  const host = renderCanvasView({ saveStatus: "saved" });

  expect(host.querySelector('[role="status"]')?.textContent).toBe("保存済み");
});

test("初期状態では Domain Event が選ばれている", () => {
  const host = renderCanvasView({});

  expect(buttonNamed(host, "Domain Event").getAttribute("aria-pressed")).toBe(
    "true",
  );
});

test("Command を選ぶと Command が押下状態になり Domain Event は解除される", () => {
  const host = renderCanvasView({});

  act(() => {
    buttonNamed(host, "Command").click();
  });

  expect(buttonNamed(host, "Command").getAttribute("aria-pressed")).toBe("true");
  expect(buttonNamed(host, "Domain Event").getAttribute("aria-pressed")).toBe(
    "false",
  );
});

test("undo が無効のときは押してもハンドラを呼ばない", () => {
  const host = renderCanvasView({
    undo: { availability: "disabled" },
  });
  const undoButton = buttonNamed(host, "元に戻す");

  expect(undoButton.getAttribute("aria-disabled")).toBe("true");
  act(() => {
    undoButton.click();
  });
  expect(undoButton.getAttribute("aria-disabled")).toBe("true");
});

test("undo が有効のときは押すとハンドラを1回呼ぶ", () => {
  const clicks: string[] = [];
  const host = renderCanvasView({
    undo: {
      availability: "enabled",
      onClick: () => {
        clicks.push("undo");
      },
    },
  });

  act(() => {
    buttonNamed(host, "元に戻す").click();
  });

  expect(clicks).toEqual(["undo"]);
});

test("キャンバス領域はスクロールバーを持たない面として置かれる", () => {
  const host = renderCanvasView({});
  const surface = host.querySelector('[role="region"][aria-label="キャンバス"]');

  expect(surface).not.toBeNull();
  expect(surface?.classList.contains("canvas-surface")).toBe(true);
});

test("子要素の付箋はキャンバス面上に置かれる", () => {
  const host = renderCanvasView({
    children: <article data-sticky-type="event">注文が確定した</article>,
  });

  const surface = host.querySelector('[role="region"][aria-label="キャンバス"]');
  expect(surface?.querySelector('[data-sticky-type="event"]')?.textContent).toBe(
    "注文が確定した",
  );
});

test("下限ズームは 10% と表示する", () => {
  const host = renderCanvasView({ zoom: 0.1 });

  expect(host.querySelector('[aria-label="ズーム 10%"]')?.textContent).toBe(
    "10%",
  );
});

test("書き込み失敗のときは保存に失敗と表示する", () => {
  const host = renderCanvasView({ saveStatus: "failed" });

  expect(host.querySelector('[role="status"]')?.textContent).toBe("保存に失敗");
});
