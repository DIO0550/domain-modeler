import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import {
  Document,
  Sticky as StickyModel,
  StickyId,
  STICKY_TYPES,
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

const existingStickyDocument = {
  ...Document.empty(),
  stickies: [
    StickyModel.create(
      StickyId.create("stk_existing000"),
      STICKY_TYPES.event,
      "注文が確定した",
      { x: 10, y: 20 },
      { width: 160, height: 100 },
    ),
  ],
};

/**
 * CanvasEditor を描画してホスト要素を返す。
 *
 * @param initialDocument 初期文書。
 * @returns 描画先のホスト要素。
 */
const renderEditor = (initialDocument?: Document): HTMLDivElement => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  act(() => {
    root.render(
      <CanvasEditor
        zoom={1}
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

/**
 * キャンバス面をクリックする。
 *
 * @param host 描画先。
 * @param point 面の左上を原点とする座標。
 */
const clickSurface = (
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

/**
 * キャンバス面をダブルクリックする。
 *
 * @param host 描画先。
 * @param point 面の左上を原点とする座標。
 */
const doubleClickSurface = (
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
    surface.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        clientX: point.x,
        clientY: point.y,
      }),
    );
  });
};

/**
 * 要素上でPointer Eventsによるドラッグを発生させる。
 *
 * @param element ドラッグ対象。
 * @param points pointerdown、pointermove群、pointerupの座標。
 */
const dragElement = (
  element: Element,
  points: readonly Readonly<{ x: number; y: number }>[],
): void => {
  const first = points[0] ?? { x: 0, y: 0 };
  const last = points[points.length - 1] ?? first;
  act(() => {
    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 1,
        clientX: first.x,
        clientY: first.y,
      }),
    );
  });
  for (const point of points.slice(1)) {
    act(() => {
      element.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          pointerId: 1,
          clientX: point.x,
          clientY: point.y,
        }),
      );
    });
  }
  act(() => {
    element.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        pointerId: 1,
        clientX: last.x,
        clientY: last.y,
      }),
    );
  });
};

/**
 * 指定した aria-label またはラベルのボタンを返す。
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

/**
 * 描画された付箋要素を返す。
 *
 * @param host 描画先。
 * @returns 付箋。無ければ空の article。
 */
const articleOf = (host: HTMLDivElement): HTMLElement => {
  const found = host.querySelector("article");
  return found instanceof HTMLElement ? found : document.createElement("article");
};

/**
 * 描画された本文エディタを返す。
 *
 * @param host 描画先。
 * @returns textarea。無ければ空の textarea。
 */
const editorOf = (host: HTMLDivElement): HTMLTextAreaElement => {
  const found = host.querySelector("textarea");
  return found instanceof HTMLTextAreaElement
    ? found
    : document.createElement("textarea");
};

test("パレットの種別を選んで空白をクリックするとその種別の付箋を作成する", () => {
  const host = renderEditor();

  act(() => {
    buttonNamed(host, "Command").click();
  });
  clickSurface(host, { x: 80, y: 90 });

  const note = host.querySelector("article");
  expect(note?.getAttribute("data-sticky-type")).toBe("command");
  expect(note?.getAttribute("data-sticky-session")).toBe("editing");
  expect(host.querySelector("textarea")).not.toBeNull();
});

test("既存の付箋をクリックすると選択する", () => {
  const host = renderEditor({
    ...Document.empty(),
    stickies: [
      StickyModel.create(
        StickyId.create("stk_existing000"),
        STICKY_TYPES.event,
        "注文が確定した",
        { x: 10, y: 20 },
        { width: 160, height: 100 },
      ),
    ],
  });

  clickSurface(host, { x: 20, y: 30 });

  expect(
    host.querySelector("article")?.getAttribute("data-sticky-session"),
  ).toBe("selected");
});

test("選択中の付箋をダブルクリックすると本文編集を始める", () => {
  const host = renderEditor({
    ...Document.empty(),
    stickies: [
      StickyModel.create(
        StickyId.create("stk_existing000"),
        STICKY_TYPES.event,
        "注文が確定した",
        { x: 10, y: 20 },
        { width: 160, height: 100 },
      ),
    ],
  });

  doubleClickSurface(host, { x: 20, y: 30 });

  expect(host.querySelector("textarea")?.value).toBe("注文が確定した");
});

test("本文を変えて確定したあと undo 1回で編集前の本文に戻る", () => {
  const host = renderEditor({
    ...Document.empty(),
    stickies: [
      StickyModel.create(
        StickyId.create("stk_existing000"),
        STICKY_TYPES.event,
        "注文が確定した",
        { x: 10, y: 20 },
        { width: 160, height: 100 },
      ),
    ],
  });

  doubleClickSurface(host, { x: 20, y: 30 });
  const foundEditor = host.querySelector("textarea");
  const editor =
    foundEditor instanceof HTMLTextAreaElement
      ? foundEditor
      : document.createElement("textarea");
  act(() => {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    nativeSetter?.call(editor, "注文がキャンセルされた");
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  });
  act(() => {
    editor.blur();
  });
  act(() => {
    buttonNamed(host, "元に戻す").click();
  });

  expect(host.querySelector(".sticky__text")?.textContent).toBe(
    "注文が確定した",
  );
});

test("選択中に Enter を押すと本文編集を始める", () => {
  const host = renderEditor({
    ...Document.empty(),
    stickies: [
      StickyModel.create(
        StickyId.create("stk_existing000"),
        STICKY_TYPES.event,
        "注文が確定した",
        { x: 10, y: 20 },
        { width: 160, height: 100 },
      ),
    ],
  });

  clickSurface(host, { x: 20, y: 30 });
  const note = host.querySelector("article");
  act(() => {
    note?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
  });

  expect(host.querySelector("textarea")).not.toBeNull();
});

test("編集中に Esc を押すと本文を確定して選択中になる", () => {
  const host = renderEditor({
    ...Document.empty(),
    stickies: [
      StickyModel.create(
        StickyId.create("stk_existing000"),
        STICKY_TYPES.event,
        "注文が確定した",
        { x: 10, y: 20 },
        { width: 160, height: 100 },
      ),
    ],
  });

  doubleClickSurface(host, { x: 20, y: 30 });
  const surface = host.querySelector(".canvas-surface");
  act(() => {
    surface?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });

  expect(host.querySelector("textarea")).toBeNull();
  expect(
    host.querySelector("article")?.getAttribute("data-sticky-session"),
  ).toBe("selected");
});

test("編集中の本文をクリックしても編集は終わらない", () => {
  const host = renderEditor(existingStickyDocument);

  doubleClickSurface(host, { x: 20, y: 30 });
  act(() => {
    editorOf(host).dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 20,
        clientY: 30,
      }),
    );
  });

  expect(host.querySelector("textarea")).not.toBeNull();
  expect(articleOf(host).getAttribute("data-sticky-session")).toBe("editing");
});

test("IME変換中の Escape では本文を確定しない", () => {
  const host = renderEditor(existingStickyDocument);

  doubleClickSurface(host, { x: 20, y: 30 });
  const foundSurface = host.querySelector(".canvas-surface");
  const surface =
    foundSurface instanceof HTMLElement
      ? foundSurface
      : document.createElement("div");
  const escapeWhileComposing = new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
  });
  Object.defineProperty(escapeWhileComposing, "isComposing", {
    value: true,
  });
  act(() => {
    surface.dispatchEvent(escapeWhileComposing);
  });

  expect(host.querySelector("textarea")).not.toBeNull();
  expect(articleOf(host).getAttribute("data-sticky-session")).toBe("editing");
});

test("付箋にフォーカスすると選択する", () => {
  const host = renderEditor(existingStickyDocument);
  const note = articleOf(host);

  act(() => {
    note.focus();
  });

  expect(note.getAttribute("data-sticky-session")).toBe("selected");
});

test("クリックで選択すると付箋がフォーカスされる", () => {
  const host = renderEditor(existingStickyDocument);

  clickSurface(host, { x: 20, y: 30 });

  expect(document.activeElement).toBe(articleOf(host));
});

test("本文を確定したあと選択中の付箋へフォーカスを戻さない", () => {
  const host = renderEditor(existingStickyDocument);

  doubleClickSurface(host, { x: 20, y: 30 });
  act(() => {
    editorOf(host).blur();
  });

  expect(host.querySelector("textarea")).toBeNull();
  expect(articleOf(host).getAttribute("data-sticky-session")).toBe("selected");
  expect(document.activeElement).not.toBe(articleOf(host));
});

test("付箋を連続pointermoveでドラッグしてもundo 1回で開始位置へ戻る", () => {
  const host = renderEditor(existingStickyDocument);

  dragElement(articleOf(host), [
    { x: 20, y: 30 },
    { x: 40, y: 50 },
    { x: 70, y: 90 },
  ]);

  expect(articleOf(host).style.left).toBe("60px");
  expect(articleOf(host).style.top).toBe("80px");
  act(() => {
    buttonNamed(host, "元に戻す").click();
  });
  expect(articleOf(host).style.left).toBe("10px");
  expect(articleOf(host).style.top).toBe("20px");
  expect(buttonNamed(host, "元に戻す").getAttribute("aria-disabled")).toBe(
    "true",
  );
});

test("選択中の南東ハンドルをドラッグすると付箋をリサイズする", () => {
  const host = renderEditor(existingStickyDocument);
  clickSurface(host, { x: 20, y: 30 });
  const handle = host.querySelector(
    '[data-resize-corner="southEast"]',
  );
  const resizeHandle = handle ?? document.createElement("span");

  dragElement(resizeHandle, [
    { x: 170, y: 120 },
    { x: 190, y: 140 },
    { x: 200, y: 150 },
  ]);

  expect(articleOf(host).style.width).toBe("190px");
  expect(articleOf(host).style.height).toBe("130px");
});
