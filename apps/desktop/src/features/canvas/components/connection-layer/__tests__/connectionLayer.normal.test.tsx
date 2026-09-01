import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import {
  type Connection,
  ConnectionId,
  Document,
  Sticky,
  StickyId,
} from "@domain-modeler/canvas-core";
import { ConnectionLayer } from "../index";

type RenderedLayer = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

const rendered: RenderedLayer[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

const actorId = StickyId.create("stk_actor000000");
const commandId = StickyId.create("stk_command0000");
const eventId = StickyId.create("stk_event000000");

const allowedConnection: Connection = {
  id: ConnectionId.create("con_allowed0000"),
  from: actorId,
  to: commandId,
  fromAnchor: "right",
  toAnchor: "left",
  label: "操作",
  note: "",
};

const warningConnection: Connection = {
  id: ConnectionId.create("con_warning0000"),
  from: commandId,
  to: eventId,
  fromAnchor: "bottom",
  toAnchor: "top",
  label: "",
  note: "",
};

const connectedDocument = {
  ...Document.empty(),
  stickies: [
    Sticky.create(
      actorId,
      "actor",
      "購買担当",
      { x: 20, y: 40 },
      { width: 120, height: 80 },
    ),
    Sticky.create(
      commandId,
      "command",
      "注文する",
      { x: 260, y: 30 },
      { width: 160, height: 100 },
    ),
    Sticky.create(
      eventId,
      "event",
      "注文された",
      { x: 500, y: 240 },
      { width: 160, height: 100 },
    ),
  ],
  connections: [allowedConnection, warningConnection],
};

/**
 * 接続線レイヤーを描画する。
 *
 * @param document 描画する文書。
 * @returns 描画先のホスト要素。
 */
const renderLayer = (document: Document): HTMLDivElement => {
  const host = documentValue.createElement("div");
  documentValue.body.append(host);
  const root: Root = createRoot(host);
  act(() => {
    root.render(<ConnectionLayer document={document} />);
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

const documentValue = globalThis.document;

Object.defineProperty(SVGTextElement.prototype, "getComputedTextLength", {
  configurable: true,
  value(this: SVGTextElement): number {
    return Array.from(this.textContent ?? "").length * 10;
  },
});

test("接続ごとにcoreが解決した端点を結ぶSVG経路と終端矢印を描画する", () => {
  const host = renderLayer(connectedDocument);
  const connection = host.querySelector('[data-connection-id="con_allowed0000"]');
  const hitArea = connection?.querySelector(".connection-layer__hit-area");
  const path = connection?.querySelector(".connection-layer__path");

  expect(hitArea?.getAttribute("d")).toBe("M 140 80 L 260 80");
  expect(path?.getAttribute("d")).toBe("M 140 80 L 260 80");
  expect(path?.getAttribute("marker-end")).toBe("url(#connection-arrow)");
});

test("空でないラベルは経路の中点付近に背景チップ付きで描画する", () => {
  const host = renderLayer(connectedDocument);
  const connection = host.querySelector('[data-connection-id="con_allowed0000"]');
  const label = connection?.querySelector(".connection-layer__label");

  expect(label?.getAttribute("transform")).toBe("translate(200 80)");
  expect(label?.querySelector("rect")).not.toBeNull();
  expect(label?.querySelector("text")?.textContent).toBe("操作");
});

test("幅広文字を含むラベルの背景は描画されたテキスト幅に合わせる", () => {
  const document = {
    ...connectedDocument,
    connections: [{ ...allowedConnection, label: "WWWWWWWW" }],
  };
  const host = renderLayer(document);
  const label = host.querySelector(".connection-layer__label");

  expect(label?.querySelector("rect")?.getAttribute("width")).toBe("96");
});

test("空文字のラベルは描画しない", () => {
  const host = renderLayer(connectedDocument);
  const connection = host.querySelector('[data-connection-id="con_warning0000"]');

  expect(connection?.querySelector(".connection-layer__label")).toBeNull();
});

test("接続ルール外の接続は警告状態と警告用矢印になる", () => {
  const host = renderLayer(connectedDocument);
  const connection = host.querySelector('[data-connection-id="con_warning0000"]');
  const path = connection?.querySelector(".connection-layer__path");

  expect(connection?.getAttribute("data-connection-status")).toBe("warning");
  expect(path?.getAttribute("marker-end")).toBe(
    "url(#connection-warning-arrow)",
  );
});

test("警告接続のツールチップにはルール外の旨と推奨接続先を表示する", () => {
  const host = renderLayer(connectedDocument);
  const connection = host.querySelector('[data-connection-id="con_warning0000"]');

  expect(connection?.querySelector("title")?.textContent).toContain(
    "推奨ルール外",
  );
  expect(connection?.querySelector("title")?.textContent).toContain(
    "Aggregate / External System",
  );
});

test("coreで端点を解決できない接続はSVG経路を描画しない", () => {
  const invalidDocument = {
    ...connectedDocument,
    connections: [
      {
        ...allowedConnection,
        to: StickyId.create("stk_missing00000"),
      },
    ],
  };
  const host = renderLayer(invalidDocument);

  expect(host.querySelector(".connection-layer__connection")).toBeNull();
});
