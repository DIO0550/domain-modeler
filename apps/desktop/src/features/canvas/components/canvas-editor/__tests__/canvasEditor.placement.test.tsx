import { act } from "react";
import { expect, test } from "vitest";
import { Document } from "@domain-modeler/canvas-core";
import {
  buttonNamed,
  clickSurface,
  existingStickyDocument,
  renderEditor,
} from "./canvasEditor.test-support";

/** ネイティブのパレットドラッグを要素へ送る。 */
const drag = (
  element: Element,
  type: "dragstart" | "dragover" | "drop" | "dragend",
  point = { x: 400, y: 300 },
): void => {
  act(() => {
    // happy-dom の DragEvent は dataTransfer を実装しないため、DOM境界だけ補完する。
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: point.x,
      clientY: point.y,
    });
    Object.defineProperty(event, "dataTransfer", { value: new DataTransfer() });
    element.dispatchEvent(event);
  });
};

/** レンダリング済みの操作対象を取得する。 */
const elementOf = (host: HTMLElement, selector: string): HTMLElement => {
  const element = host.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`要素がありません: ${selector}`);
  }
  return element;
};

test("部品を選んでカーソルを動かすと配置位置にプレビューを表示し、1個配置すると消える", () => {
  const host = renderEditor();
  const surface = elementOf(host, ".canvas-surface");
  act(() => {
    buttonNamed(host, "Command").click();
  });
  act(() => {
    surface.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 200,
        clientY: 150,
      }),
    );
  });
  const preview = elementOf(host, ".canvas-placement-preview");
  expect(preview.dataset.stickyType).toBe("command");
  expect(preview.style.left).toBe("200px");
  expect(preview.style.top).toBe("150px");
  expect(host.querySelectorAll("article")).toHaveLength(0);
  clickSurface(host, { x: 200, y: 150 });
  expect(host.querySelector(".canvas-placement-preview")).toBeNull();
  clickSurface(host, { x: 500, y: 400 });
  expect(host.querySelectorAll("article")).toHaveLength(1);
});

test("パレットからのドロップはパン・ズームを反映した座標に1個だけ配置する", () => {
  const host = renderEditor({
    ...Document.empty(),
    viewport: { x: 40, y: 20, zoom: 2 },
  });
  const palette = buttonNamed(host, "Command");
  const surface = elementOf(host, ".canvas-surface");
  drag(palette, "dragstart");
  drag(surface, "dragover");
  expect(elementOf(host, ".canvas-placement-preview").style.transform).toBe(
    "scale(2)",
  );
  drag(surface, "drop");
  drag(palette, "dragend");
  const sticky = elementOf(host, "article");
  expect(sticky.dataset.stickyType).toBe("command");
  expect(sticky.style.left).toBe("180px");
  expect(sticky.style.top).toBe("140px");
  clickSurface(host, { x: 700, y: 500 });
  expect(host.querySelectorAll("article")).toHaveLength(1);
  expect(buttonNamed(host, "選択").getAttribute("aria-pressed")).toBe("true");
});

test("パレットドラッグをキャンバス外で終了すると配置待ちもプレビューも残らない", () => {
  const host = renderEditor();
  const palette = buttonNamed(host, "Command");
  act(() => {
    palette.click();
  });
  drag(palette, "dragstart");
  drag(elementOf(host, ".canvas-surface"), "dragover");
  drag(palette, "dragend");
  act(() => {
    palette.dispatchEvent(
      new MouseEvent("click", { bubbles: true, detail: 1 }),
    );
  }); // drag後の派生clickも配置を再開しない
  expect(host.querySelector(".canvas-placement-preview")).toBeNull();
  clickSurface(host, { x: 400, y: 300 });
  expect(host.querySelectorAll("article")).toHaveLength(0);
});

test("既存の付箋へドロップしても新しい付箋を配置しない", () => {
  const host = renderEditor(existingStickyDocument);
  const palette = buttonNamed(host, "Actor");
  drag(palette, "dragstart");
  drag(elementOf(host, "article"), "drop", { x: 40, y: 50 });
  drag(palette, "dragend");
  clickSurface(host, { x: 400, y: 300 });
  expect(host.querySelectorAll("article")).toHaveLength(1);
});

test("配置待ちで既存の付箋を触ると選択操作へ戻り、次の空白クリックで配置しない", () => {
  const host = renderEditor(existingStickyDocument);
  act(() => {
    buttonNamed(host, "Command").click();
  });
  act(() => {
    elementOf(host, "article").dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
  });
  clickSurface(host, { x: 400, y: 300 });
  expect(host.querySelectorAll("article")).toHaveLength(1);
  expect(buttonNamed(host, "選択").getAttribute("aria-pressed")).toBe("true");
});

test("外部由来のドロップは付箋を作成しない", () => {
  const host = renderEditor();
  drag(elementOf(host, ".canvas-surface"), "drop");
  expect(host.querySelectorAll("article")).toHaveLength(0);
});

test("配置待ちのEscでプレビューを消し、次のクリックでは配置しない", () => {
  const host = renderEditor();
  const palette = buttonNamed(host, "Command");
  act(() => {
    palette.click();
  });
  act(() => {
    elementOf(host, ".canvas-surface").dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 200,
        clientY: 150,
      }),
    );
  });
  act(() => {
    palette.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
    );
  });
  expect(host.querySelector(".canvas-placement-preview")).toBeNull();
  clickSurface(host, { x: 200, y: 150 });
  expect(host.querySelectorAll("article")).toHaveLength(0);
});

test("付箋を選ぶと右パネルに本文を表示し、編集ボタンから本文を編集できる", () => {
  const host = renderEditor(existingStickyDocument);
  clickSurface(host, { x: 40, y: 50 });
  expect(elementOf(host, ".canvas-inspector").textContent).toContain(
    "注文が確定した",
  );
  act(() => {
    buttonNamed(host, "本文を編集").click();
  });
  expect(elementOf(host, "article").dataset.stickySession).toBe("editing");
  expect(host.querySelector("textarea")).not.toBeNull();
});
