import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import {
  Sticky as StickyModel,
  StickyId,
  type StickyType,
} from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../../../domains/sticky-appearance";
import {
  Sticky,
  type StickyChrome,
  type StickyManipulation,
} from "../index";

type RenderedSticky = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

const rendered: RenderedSticky[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

/**
 * Sticky を描画してホスト要素を返す。
 *
 * @param sticky 描画する付箋。
 * @param chrome 選択または編集の表示。省略時は通常表示。
 * @returns 描画先のホスト要素。
 */
const renderSticky = (
  sticky: StickyModel,
  chrome?: StickyChrome,
  manipulation?: StickyManipulation,
): HTMLDivElement => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  act(() => {
    root.render(
      <Sticky
        sticky={sticky}
        chrome={chrome}
        manipulation={manipulation}
      />,
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
 * 表示確認用の付箋を組み立てる。
 *
 * @param type 種別。
 * @param text 本文。
 * @returns 標準サイズの付箋。
 */
const stickyOf = (
  type: StickyType,
  text: string,
): StickyModel => {
  const appearance = StickyAppearance.of(type);
  return StickyModel.create(
    StickyId.create(`stk_${type}`),
    type,
    text,
    { x: 24, y: 32 },
    appearance.defaultSize,
  );
};

test.each(StickyAppearance.all())(
  "$caption は種別名キャプションと標準サイズで表示される",
  (appearance) => {
    const host = renderSticky(stickyOf(appearance.type, "本文"));
    const note = host.querySelector("article");

    expect(note?.getAttribute("data-sticky-type")).toBe(appearance.type);
    expect(note?.querySelector(".sticky__caption")?.textContent).toBe(
      appearance.caption,
    );
    expect((note as HTMLElement | null)?.style.width).toBe(
      `${appearance.defaultSize.width}px`,
    );
    expect((note as HTMLElement | null)?.style.height).toBe(
      `${appearance.defaultSize.height}px`,
    );
    expect(host.querySelector(".sticky__text")?.textContent).toBe("本文");
  },
);

test("本文は付箋の中央に改行を残して表示する", () => {
  const host = renderSticky(
    stickyOf("event", "注文が\n確定した"),
  );

  expect(host.querySelector(".sticky__text")?.textContent).toBe(
    "注文が\n確定した",
  );
});

test("ファイルの size が標準サイズより優先される", () => {
  const appearance = StickyAppearance.of("event");
  const sticky = StickyModel.create(
    StickyId.create("stk_resized"),
    "event",
    "注文が確定した",
    { x: 0, y: 0 },
    { width: 240, height: 160 },
  );
  const host = renderSticky(sticky);
  const note = host.querySelector("article") as HTMLElement;

  expect(note.style.width).toBe("240px");
  expect(note.style.height).toBe("160px");
  expect(note.style.width).not.toBe(`${appearance.defaultSize.width}px`);
});

test("ワールド座標の位置を left / top に書き込む", () => {
  const host = renderSticky(stickyOf("command", "注文を確定する"));
  const note = host.querySelector("article") as HTMLElement;

  expect(note.style.left).toBe("24px");
  expect(note.style.top).toBe("32px");
});

test("Hotspot の紙面だけ傾き修飾を持つ", () => {
  const hotspot = renderSticky(stickyOf("hotspot", "在庫引当のタイミングは？"));
  const event = renderSticky(stickyOf("event", "注文が確定した"));

  expect(
    hotspot.querySelector(".sticky__face")?.classList.contains(
      "sticky__face--tilted",
    ),
  ).toBe(true);
  expect(
    event.querySelector(".sticky__face")?.classList.contains(
      "sticky__face--tilted",
    ),
  ).toBe(false);
});

test("空の本文でも種別名は表示する", () => {
  const host = renderSticky(stickyOf("actor", ""));
  const note = host.querySelector("article");

  expect(note?.getAttribute("aria-label")).toBe("Actor");
  expect(note?.querySelector(".sticky__caption")?.textContent).toBe("Actor");
  expect(host.querySelector(".sticky__text")?.textContent).toBe("");
});

test("最小サイズでも種別名と本文を表示する", () => {
  const sticky = StickyModel.create(
    StickyId.create("stk_min"),
    "event",
    "注文",
    { x: 0, y: 0 },
    { width: 60, height: 40 },
  );
  const host = renderSticky(sticky);
  const note = host.querySelector("article") as HTMLElement;

  expect(note.style.width).toBe("60px");
  expect(note.style.height).toBe("40px");
  expect(note.querySelector(".sticky__caption")?.textContent).toBe(
    "Domain Event",
  );
  expect(host.querySelector(".sticky__text")?.textContent).toBe("注文");
});

test("長い本文があっても付箋のサイズは変えない", () => {
  const appearance = StickyAppearance.of("policy");
  const host = renderSticky(
    stickyOf(
      "policy",
      "在庫が足りなければ保留し、補充を待ってから再実行する方針をここに書く",
    ),
  );
  const note = host.querySelector("article") as HTMLElement;

  expect(note.style.width).toBe(`${appearance.defaultSize.width}px`);
  expect(note.style.height).toBe(`${appearance.defaultSize.height}px`);
});

test("通常表示の付箋もキーボードでフォーカスできる", () => {
  const host = renderSticky(stickyOf("event", "注文が確定した"));

  expect(host.querySelector("article")?.getAttribute("tabindex")).toBe("0");
});

test("選択中は選択セッションとして表示する", () => {
  const host = renderSticky(stickyOf("event", "注文が確定した"), {
    status: "selected",
  });

  expect(
    host.querySelector("article")?.getAttribute("data-sticky-session"),
  ).toBe("selected");
  expect(
    host.querySelector("article")?.classList.contains("sticky--selected"),
  ).toBe(true);
});

test("編集中は下書き本文を textarea に出す", () => {
  const host = renderSticky(stickyOf("event", "注文が確定した"), {
    status: "editing",
    draftText: "下書き",
    onDraftChange: () => undefined,
    onCommit: () => undefined,
  });

  expect(host.querySelector("textarea")?.value).toBe("下書き");
  expect(
    host.querySelector("article")?.getAttribute("data-sticky-session"),
  ).toBe("editing");
});

test("選択中は四隅にリサイズハンドルを表示する", () => {
  const manipulation: StickyManipulation = {
    onDragStart: () => undefined,
    onResizeStart: () => undefined,
    onPointerMove: () => undefined,
    onPointerCommit: () => undefined,
  };
  const host = renderSticky(
    stickyOf("event", "注文が確定した"),
    { status: "selected" },
    manipulation,
  );

  expect(
    Array.from(host.querySelectorAll(".sticky__resize-handle")).map((handle) =>
      handle.getAttribute("data-resize-corner"),
    ),
  ).toEqual(["northWest", "northEast", "southEast", "southWest"]);
});

test("通常表示と本文編集中はリサイズハンドルを表示しない", () => {
  const manipulation: StickyManipulation = {
    onDragStart: () => undefined,
    onResizeStart: () => undefined,
    onPointerMove: () => undefined,
    onPointerCommit: () => undefined,
  };
  const plain = renderSticky(
    stickyOf("event", "注文が確定した"),
    { status: "plain" },
    manipulation,
  );
  const editing = renderSticky(
    stickyOf("command", "注文を確定する"),
    {
      status: "editing",
      draftText: "注文を確定する",
      onDraftChange: () => undefined,
      onCommit: () => undefined,
    },
    manipulation,
  );

  expect(plain.querySelector(".sticky__resize-handle")).toBeNull();
  expect(editing.querySelector(".sticky__resize-handle")).toBeNull();
});
