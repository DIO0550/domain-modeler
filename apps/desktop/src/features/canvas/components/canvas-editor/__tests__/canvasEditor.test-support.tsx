import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach } from "vitest";
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
      <CanvasEditor
        saveStatus="saved"
        initialDocument={initialDocument}
      />,
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
  const found = host.querySelector("textarea");
  return found instanceof HTMLTextAreaElement
    ? found
    : document.createElement("textarea");
};
