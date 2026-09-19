import { act } from "react";
import { expect, test } from "vitest";
import {
  documentWithConnection,
  renderEditor,
} from "./canvasEditor.test-support";

const pointer = (
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

for (const completion of ["lostpointercapture", "pointercancel", "pointerup"]) {
  test(`${completion}後の位置と接続を維持し、取消の場合だけ元に戻す`, () => {
    const host = renderEditor(documentWithConnection);
    const article = host.querySelector<HTMLElement>(
      `[data-sticky-id="${documentWithConnection.stickies[0].id}"]`,
    );
    if (!article) {
      throw new Error("付箋がない");
    }
    article.setPointerCapture = () => {};
    const path = () =>
      host.querySelector(".connection-layer__path")?.getAttribute("d");
    const original = path();
    pointer(article, "pointerdown");
    pointer(article, "pointermove", { x: 310, y: 360 });
    const moved = path();
    expect(article.style.top).toBe("320px");
    expect(moved).not.toBe(original);
    pointer(article, completion);
    pointer(article, "lostpointercapture");
    pointer(article, "pointerup");
    expect(article.style.top).toBe(
      completion === "pointercancel" ? "20px" : "320px",
    );
    expect(path()).toBe(completion === "pointercancel" ? original : moved);
    if (completion === "pointercancel") {
      return;
    }
    act(() =>
      article.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: true,
          bubbles: true,
        }),
      ),
    );
    expect(article.style.top).toBe("20px");
    expect(path()).toBe(original);
    act(() =>
      article.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      ),
    );
    expect(article.style.top).toBe("320px");
    expect(path()).toBe(moved);
  });
}
