import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import {
  Document,
  Sticky,
  StickyId,
  STICKY_TYPES,
} from "@domain-modeler/canvas-core";
import {
  useStickyInteractions,
  type UseStickyInteractionsResult,
} from "../index";
import { STICKY_RESIZE_CORNERS } from "../../domains/sticky-interaction";

type RenderedHook = Readonly<{
  latest: { current: UseStickyInteractionsResult | undefined };
  unmount: () => void;
}>;

const rendered: RenderedHook[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

/**
 * フックを描画し、最新の戻り値を参照できるようにする。
 *
 * @param initialDocument 初期文書。
 * @returns 最新の戻り値。
 */
const renderHook = (
  initialDocument?: Document,
): { current: UseStickyInteractionsResult | undefined } => {
  const latest: { current: UseStickyInteractionsResult | undefined } = {
    current: undefined,
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  const Probe = () => {
    latest.current = useStickyInteractions(initialDocument);
    return null;
  };

  act(() => {
    root.render(<Probe />);
  });

  rendered.push({
    latest,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  });
  return latest;
};

test("空白をクリックすると付箋を作成して本文編集を始める", () => {
  const latest = renderHook();

  act(() => {
    latest.current?.clickAt({ x: 24, y: 32 });
  });

  expect(latest.current?.stickies).toHaveLength(1);
  expect(latest.current?.stickies[0]?.position).toEqual({ x: 24, y: 32 });
  expect(latest.current?.session.status).toBe("editing");
});

test("本文を複数回変えて確定すると undo 1回で編集前の本文に戻る", () => {
  const existing = Sticky.create(
    StickyId.create("stk_existing000"),
    STICKY_TYPES.event,
    "注文が確定した",
    { x: 10, y: 20 },
    { width: 160, height: 100 },
  );
  const latest = renderHook({ ...Document.empty(), stickies: [existing] });

  act(() => {
    latest.current?.clickAt({ x: 10, y: 20 });
  });
  act(() => {
    latest.current?.pressEnter();
  });
  act(() => {
    latest.current?.changeDraft("注文が");
  });
  act(() => {
    latest.current?.changeDraft("注文がキャンセルされた");
  });
  act(() => {
    latest.current?.commitEdit();
  });
  act(() => {
    latest.current?.undo();
  });

  expect(latest.current?.stickies[0]?.text).toBe("注文が確定した");
});

test("連続するポインタ移動を確定すると undo 1回でドラッグ開始位置に戻る", () => {
  const existing = Sticky.create(
    StickyId.create("stk_existing000"),
    STICKY_TYPES.event,
    "注文が確定した",
    { x: 10, y: 20 },
    { width: 160, height: 100 },
  );
  const latest = renderHook({ ...Document.empty(), stickies: [existing] });

  act(() => {
    latest.current?.beginDrag(existing.id, { x: 20, y: 30 });
  });
  act(() => {
    latest.current?.movePointer({ x: 30, y: 40 });
  });
  act(() => {
    latest.current?.movePointer({ x: 70, y: 90 });
  });
  act(() => {
    latest.current?.commitManipulation();
  });
  expect(latest.current?.stickies[0]?.position).toEqual({ x: 60, y: 80 });

  act(() => {
    latest.current?.undo();
  });

  expect(latest.current?.stickies[0]?.position).toEqual({ x: 10, y: 20 });
  expect(latest.current?.hasUndo).toBe(false);
});

test("選択中の付箋を四隅ハンドルからリサイズできる", () => {
  const existing = Sticky.create(
    StickyId.create("stk_existing000"),
    STICKY_TYPES.event,
    "注文が確定した",
    { x: 10, y: 20 },
    { width: 160, height: 100 },
  );
  const latest = renderHook({ ...Document.empty(), stickies: [existing] });

  act(() => {
    latest.current?.select(existing.id);
  });
  act(() => {
    latest.current?.beginResize(STICKY_RESIZE_CORNERS.southEast, {
      x: 170,
      y: 120,
    });
  });
  act(() => {
    latest.current?.movePointer({ x: 200, y: 150 });
  });
  act(() => {
    latest.current?.commitManipulation();
  });

  expect(latest.current?.stickies[0]?.size).toEqual({
    width: 190,
    height: 130,
  });
});
