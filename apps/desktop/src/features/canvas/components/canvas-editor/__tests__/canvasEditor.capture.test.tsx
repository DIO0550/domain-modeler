import { act } from "react";
import { expect, test } from "vitest";
import {
  documentWithConnection,
  pointer,
  renderEditor,
  stickyArticleOf,
} from "./canvasEditor.test-support";

/** 接続済みの付箋をドラッグし、移動前後の接続線と操作対象を返す。 */
const dragConnectedSticky = (): Readonly<{
  article: HTMLElement;
  original: string | null | undefined;
  moved: string | null | undefined;
}> => {
  const host = renderEditor(documentWithConnection);
  const article = stickyArticleOf(host, documentWithConnection.stickies[0].id);
  article.setPointerCapture = () => {};
  const path = () =>
    host.querySelector(".connection-layer__path")?.getAttribute("d");
  const original = path();
  pointer(article, "pointerdown");
  pointer(article, "pointermove", { x: 310, y: 360 });
  const moved = path();
  expect(article.style.top).toBe("320px");
  expect(moved).not.toBe(original);
  return { article, original, moved };
};

/** 履歴ショートカットを付箋へ送る。 */
const history = (article: HTMLElement, direction: "undo" | "redo"): void => {
  act(() =>
    article.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        shiftKey: direction === "redo",
        bubbles: true,
      }),
    ),
  );
};

/** 移動後の接続線を読み直す。 */
const pathOf = (article: HTMLElement): string | null | undefined =>
  article
    .closest(".canvas-world")
    ?.querySelector(".connection-layer__path")
    ?.getAttribute("d");

for (const completion of ["lostpointercapture", "pointerup"]) {
  test(`${completion}後は移動後の位置と接続を維持し、undo/redo で一緒に戻る`, () => {
    const { article, original, moved } = dragConnectedSticky();

    pointer(article, completion);
    pointer(article, "lostpointercapture");
    pointer(article, "pointerup");
    expect(article.style.top).toBe("320px");
    expect(pathOf(article)).toBe(moved);

    history(article, "undo");
    expect(article.style.top).toBe("20px");
    expect(pathOf(article)).toBe(original);

    history(article, "redo");
    expect(article.style.top).toBe("320px");
    expect(pathOf(article)).toBe(moved);
  });
}

test("pointercancel後は移動を取り消して元の位置と接続へ戻す", () => {
  const { article, original } = dragConnectedSticky();

  pointer(article, "pointercancel");
  pointer(article, "lostpointercapture");
  pointer(article, "pointerup");

  expect(article.style.top).toBe("20px");
  expect(pathOf(article)).toBe(original);
});
