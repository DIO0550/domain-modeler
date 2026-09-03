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
  useConnectionInteractions,
  type UseConnectionInteractionsResult,
} from "../index";

type RenderedHook = Readonly<{
  unmount: () => void;
}>;

const rendered: RenderedHook[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

const sourceId = StickyId.create("stk_source00000");
const targetId = StickyId.create("stk_target00000");
const initialDocument = {
  ...Document.empty(),
  stickies: [
    Sticky.create(
      sourceId,
      STICKY_TYPES.actor,
      "購入者",
      { x: 20, y: 20 },
      { width: 120, height: 80 },
    ),
    Sticky.create(
      targetId,
      STICKY_TYPES.command,
      "注文する",
      { x: 240, y: 20 },
      { width: 160, height: 100 },
    ),
  ],
};

/** 接続操作フックを描画し、最新の戻り値を参照できるようにする。 */
const renderHook = (): {
  current: UseConnectionInteractionsResult | undefined;
} => {
  const latest: {
    current: UseConnectionInteractionsResult | undefined;
  } = { current: undefined };
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  const Probe = () => {
    latest.current = useConnectionInteractions(initialDocument);
    return null;
  };

  act(() => {
    root.render(<Probe />);
  });
  rendered.push({
    unmount: () => {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  });
  return latest;
};

test("接続モードでキャンバス上の始点と終点をクリックすると接続を作成する", () => {
  const latest = renderHook();

  act(() => {
    latest.current?.toggleConnectionMode();
  });
  act(() => {
    latest.current?.clickAt({ x: 40, y: 40 });
  });
  act(() => {
    latest.current?.clickAt({ x: 260, y: 40 });
  });

  expect(latest.current?.connections).toHaveLength(1);
  expect(latest.current?.connections[0]).toMatchObject({
    from: sourceId,
    to: targetId,
  });
  expect(latest.current?.connectionSession.status).toBe("selected");
});

test("接続のラベル編集と削除は付箋操作と同じundo履歴を使う", () => {
  const latest = renderHook();

  act(() => {
    latest.current?.toggleConnectionMode();
    latest.current?.clickAt({ x: 40, y: 40 });
    latest.current?.clickAt({ x: 260, y: 40 });
  });
  const connectionId = latest.current?.connections[0]?.id;
  act(() => {
    if (connectionId !== undefined) {
      latest.current?.editConnection(connectionId);
    }
  });
  act(() => {
    latest.current?.changeConnectionDraft("操作");
    latest.current?.commitConnectionEdit();
  });
  act(() => {
    latest.current?.pressDelete();
  });

  expect(latest.current?.connections).toHaveLength(0);

  act(() => {
    latest.current?.undo();
  });
  expect(latest.current?.connections[0]?.label).toBe("操作");
});
