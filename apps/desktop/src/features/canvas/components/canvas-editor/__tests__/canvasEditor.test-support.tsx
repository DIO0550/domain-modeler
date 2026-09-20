import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect } from "vitest";
import {
  ConnectionId,
  Document,
  Sticky,
  StickyId,
  STICKY_TYPES,
  type Document as CanvasDocument,
} from "@domain-modeler/canvas-core";
import { CanvasEditor } from "../index";

type RenderedEditor = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

const rendered: RenderedEditor[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

const emptyRect = {
  x: 0,
  y: 0,
  width: 800,
  height: 600,
  top: 0,
  left: 0,
  bottom: 600,
  right: 800,
  toJSON: () => ({}),
};

export const existingStickyDocument = {
  ...Document.empty(),
  stickies: [
    Sticky.create(
      StickyId.create("stk_existing000"),
      STICKY_TYPES.event,
      "注文が確定した",
      { x: 10, y: 20 },
      { width: 160, height: 100 },
    ),
  ],
};

const frontSticky = Sticky.create(
  StickyId.create("stk_front0000000"),
  STICKY_TYPES.command,
  "メールを送る",
  { x: 240, y: 20 },
  { width: 160, height: 100 },
);

export const documentWithTwoStickies = {
  ...existingStickyDocument,
  stickies: [...existingStickyDocument.stickies, frontSticky],
};

export const documentWithConnection = {
  ...documentWithTwoStickies,
  connections: [
    {
      id: ConnectionId.create("con_existing000"),
      from: StickyId.create("stk_existing000"),
      to: frontSticky.id,
      fromAnchor: "right" as const,
      toAnchor: "left" as const,
      label: "通知",
      note: "",
    },
  ],
};

/** CanvasEditor を描画してホスト要素を返す。 */
export const renderEditor = (
  initialDocument?: CanvasDocument,
): HTMLDivElement => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  act(() => {
    root.render(
      <CanvasEditor saveStatus="saved" initialDocument={initialDocument} />,
    );
  });

  const surface = host.querySelector(".canvas-surface");
  const canvasSurface =
    surface instanceof HTMLElement ? surface : document.createElement("div");
  canvasSurface.getBoundingClientRect = () => emptyRect;

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

/** キャンバス面をクリックする。 */
export const clickSurface = (
  host: HTMLDivElement,
  point: Readonly<{ x: number; y: number }>,
): void => {
  const found = host.querySelector(".canvas-surface");
  const surface =
    found instanceof HTMLElement ? found : document.createElement("div");
  act(() => {
    surface.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: point.x,
        clientY: point.y,
      }),
    );
  });
};

/** キャンバス面をダブルクリックする。 */
export const doubleClickSurface = (
  host: HTMLDivElement,
  point: Readonly<{ x: number; y: number }>,
): void => {
  const found = host.querySelector(".canvas-surface");
  const surface =
    found instanceof HTMLElement ? found : document.createElement("div");
  act(() => {
    surface.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        detail: 1,
        clientX: point.x,
        clientY: point.y,
      }),
    );
    surface.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        detail: 2,
        clientX: point.x,
        clientY: point.y,
      }),
    );
    surface.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        clientX: point.x,
        clientY: point.y,
      }),
    );
  });
};

/** 指定した aria-label またはラベルのボタンを返す。 */
export const buttonNamed = (
  host: HTMLDivElement,
  name: string,
): HTMLButtonElement => {
  const found = Array.from(host.querySelectorAll("button")).find(
    (element) =>
      element.getAttribute("aria-label") === name ||
      element.textContent === name,
  );
  return found instanceof HTMLButtonElement
    ? found
    : document.createElement("button");
};

/** 描画された付箋要素を返す。 */
export const articleOf = (host: HTMLDivElement): HTMLElement => {
  const found = host.querySelector("article");
  return found instanceof HTMLElement
    ? found
    : document.createElement("article");
};

/** 描画された本文エディタを返す。 */
export const editorOf = (host: HTMLDivElement): HTMLTextAreaElement => {
  const found = host.querySelector(".sticky__editor");
  return found instanceof HTMLTextAreaElement
    ? found
    : document.createElement("textarea");
};

/** 履歴ショートカットをキャンバスへ送る。 */
export const undo = (host: HTMLDivElement): void => {
  act(() => {
    host
      .querySelector(".canvas-surface")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: true,
          bubbles: true,
        }),
      );
  });
};

/** undo対象が無いときに表示文書が変わらないことを検証する。 */
export const expectUndoUnchanged = (host: HTMLDivElement): void => {
  const before = host.querySelector(".canvas-world")?.innerHTML;
  undo(host);
  expect(host.querySelector(".canvas-world")?.innerHTML).toBe(before);
};

/** セレクタに一致する要素を返す。見つからない場合はテストを落とす。 */
export const elementOf = (host: HTMLElement, selector: string): HTMLElement => {
  const found = host.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`要素がありません: ${selector}`);
  }
  return found;
};

/** 指定IDの付箋要素を返す。 */
export const stickyArticleOf = (
  host: HTMLElement,
  stickyId: string,
): HTMLElement => elementOf(host, `[data-sticky-id="${stickyId}"]`);

/** 右プロパティの本文入力欄を返す。 */
export const propertyBodyOf = (host: HTMLElement): HTMLTextAreaElement => {
  const found = host.querySelector('[aria-label="プロパティの本文"]');
  if (!(found instanceof HTMLTextAreaElement)) {
    throw new Error("本文欄がありません");
  }
  return found;
};

/** キャンバス面の要素を返す。 */
export const surfaceOf = (host: HTMLElement): HTMLElement =>
  elementOf(host, ".canvas-surface");

/**
 * 指定した辺の接続ハンドルを返す。
 * happy-dom が実装しないポインター捕捉の境界だけ補う。
 *
 * @param host 描画先のホスト要素。
 * @param anchor 取得する辺。
 * @returns 接続ハンドルのボタン要素。
 */
export const connectionHandleOf = (
  host: HTMLElement,
  anchor: string,
): HTMLButtonElement => {
  const found = host.querySelector(`[data-connection-anchor="${anchor}"]`);
  if (!(found instanceof HTMLButtonElement)) {
    throw new Error(`接続ハンドルがありません: ${anchor}`);
  }
  found.setPointerCapture = () => {};
  found.releasePointerCapture = () => {};
  return found;
};

/** ポインターイベントを要素へ送る。 */
export const pointer = (
  element: Element,
  type: string,
  point = { x: 80, y: 60 },
): void => {
  act(() => {
    element.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: point.x,
        clientY: point.y,
      }),
    );
  });
};
