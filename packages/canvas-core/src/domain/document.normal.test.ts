import { expect, it, vi } from "vitest";
import { DEFAULT_TITLE, Document } from "./document";
import { type Connection, ConnectionId } from "./connection";
import { StickyId } from "./sticky";
import type { Sticky } from "./sticky";

{
  it("タイトルを指定した場合、指定したタイトルでドキュメントを生成する", () => {
    const doc = Document.empty("My Canvas");

    expect(doc.title).toBe("My Canvas");
    expect(doc.version).toBe("1.0");
    expect(doc.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(doc.stickies).toEqual([]);
    expect(doc.connections).toEqual([]);
  });

  it("タイトルを省略した場合、デフォルトタイトルでドキュメントを生成する", () => {
    const doc = Document.empty();

    expect(doc.title).toBe(DEFAULT_TITLE);
    expect(doc.version).toBe("1.0");
    expect(doc.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(doc.stickies).toEqual([]);
    expect(doc.connections).toEqual([]);
  });
}

{
  const idA = StickyId.create("stk_aaaaaaaaaaaa");
  const idB = StickyId.create("stk_bbbbbbbbbbbb");
  const idMissing = StickyId.create("stk_missing");

  const stickies: readonly Sticky[] = [
    {
      id: idA,
      type: "event",
      text: "first",
      position: { x: 10, y: 20 },
      size: { width: 100, height: 80 },
    },
    {
      id: idB,
      type: "actor",
      text: "second",
      position: { x: 30, y: 40 },
      size: { width: 120, height: 90 },
    },
  ];

  const connections: readonly Connection[] = [
    {
      id: ConnectionId.create("con_111111111111"),
      from: idA,
      to: idB,
      label: "",
      note: "",
    },
    {
      id: ConnectionId.create("con_222222222222"),
      from: StickyId.create("stk_xxxxxxxxxxxx"),
      to: StickyId.create("stk_yyyyyyyyyyyy"),
      label: "",
      note: "",
    },
  ];

  const baseDocument = {
    ...Document.empty("My Canvas"),
    stickies,
    connections,
  };

  it("付箋IDに一致する付箋を返す", () => {
    expect(Document.stickyById(baseDocument, idA)).toEqual({
      some: true,
      value: stickies[0],
    });
  });

  it("存在しない付箋IDでは値を返さない", () => {
    expect(Document.stickyById(baseDocument, idMissing)).toEqual({
      some: false,
    });
  });

  it("付箋を追加すると末尾(最前面)に配置され、入力を変更しない", () => {
    const randomUUIDSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("12345678-90ab-cdef-1234-567890abcdef");

    const result = Document.addSticky(
      baseDocument,
      "command",
      "new sticky",
      { x: 50, y: 60 },
      { width: 140, height: 100 },
    );
    expect(result.ok).toBe(true);
    const next = (result as { ok: true; value: Document }).value;

    expect(baseDocument.stickies).toHaveLength(2);
    expect(baseDocument.stickies).toBe(stickies);
    expect(baseDocument).not.toBe(next);
    expect(next.stickies).toHaveLength(3);
    expect(next.stickies[next.stickies.length - 1]).toEqual({
      id: StickyId.create("stk_1234567890ab"),
      type: "command",
      text: "new sticky",
      position: { x: 50, y: 60 },
      size: { width: 140, height: 100 },
    });

    randomUUIDSpy.mockRestore();
  });

  it("付箋本文を変更でき、入力を変更しない", () => {
    const next = Document.updateStickyText(baseDocument, idA, "updated");

    expect(baseDocument.stickies[0].text).toBe("first");
    expect(baseDocument).not.toBe(next);
    expect(next.stickies[0].text).toBe("updated");
    expect(next.stickies[1]).toEqual(baseDocument.stickies[1]);
  });

  it("存在しない付箋IDを本文変更した場合は内容を維持する", () => {
    const next = Document.updateStickyText(baseDocument, idMissing, "updated");
    expect(next).toEqual(baseDocument);
  });

  it("付箋を移動でき、入力を変更しない", () => {
    const next = Document.moveSticky(baseDocument, idA, {
      x: 111,
      y: 222,
    });

    expect(baseDocument.stickies[0].position).toEqual({ x: 10, y: 20 });
    expect(baseDocument).not.toBe(next);
    expect(next.stickies[0].position).toEqual({ x: 111, y: 222 });
  });

  it("存在しない付箋IDを移動した場合は内容を維持する", () => {
    const next = Document.moveSticky(baseDocument, idMissing, { x: 1, y: 2 });
    expect(next).toEqual(baseDocument);
  });

  it("付箋をリサイズできる", () => {
    const result = Document.resizeSticky(baseDocument, idA, {
      width: 200,
      height: 110,
    });
    expect(result.ok).toBe(true);
    const next = (result as { ok: true; value: Document }).value;

    expect(baseDocument.stickies[0].size).toEqual({ width: 100, height: 80 });
    expect(baseDocument).not.toBe(next);
    expect(next.stickies[0].size).toEqual({ width: 200, height: 110 });
  });

  it("リサイズで不正サイズを拒否する", () => {
    const result = Document.resizeSticky(baseDocument, idA, {
      width: 0,
      height: 110,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_STICKY_SIZE",
        message: "Sticky size must be positive",
      },
    });
  });

  it("付箋種別を変更できる", () => {
    const next = Document.changeStickyType(baseDocument, idA, "policy");

    expect(baseDocument.stickies[0].type).toBe("event");
    expect(baseDocument).not.toBe(next);
    expect(next.stickies[0].type).toBe("policy");
  });

  it("存在しない付箋IDの種別変更は内容を維持する", () => {
    const next = Document.changeStickyType(baseDocument, idMissing, "policy");
    expect(next).toEqual(baseDocument);
  });

  it("付箋を前面化すると配列末尾へ移動する", () => {
    const next = Document.bringStickyToFront(baseDocument, idA);

    expect(baseDocument.stickies.map((sticky) => sticky.id)).toEqual([idA, idB]);
    expect(baseDocument).not.toBe(next);
    expect(next.stickies.map((sticky) => sticky.id)).toEqual([idB, idA]);
  });

  it("すでに最前面の付箋を前面化した場合は同一インスタンスを返す", () => {
    const next = Document.bringStickyToFront(baseDocument, idB);
    expect(next).toBe(baseDocument);
  });

  it("存在しない付箋IDを前面化した場合は同一インスタンスを返す", () => {
    const next = Document.bringStickyToFront(baseDocument, idMissing);
    expect(next).toBe(baseDocument);
  });

  it("付箋削除時に関連接続をカスケード削除する", () => {
    const next = Document.removeSticky(baseDocument, idA);

    expect(next.stickies.map((sticky) => sticky.id)).toEqual([idB]);
    expect(next.connections.map((connection) => connection.id)).toEqual([
      "con_222222222222",
    ]);
    expect(baseDocument.connections).toHaveLength(2);
  });

  it("存在しない付箋IDを削除した場合は内容を維持する", () => {
    const next = Document.removeSticky(baseDocument, idMissing);
    expect(next).toEqual(baseDocument);
  });

  it("追加時に不正サイズを拒否する", () => {
    const result = Document.addSticky(
      baseDocument,
      "command",
      "new sticky",
      { x: 50, y: 60 },
      { width: 140, height: 0 },
    );

    expect(result.ok).toBe(false);
  });

  it("追加時に負のサイズを拒否する", () => {
    const result = Document.addSticky(
      baseDocument,
      "command",
      "new sticky",
      { x: 50, y: 60 },
      { width: -1, height: 10 },
    );

    expect(result.ok).toBe(false);
  });
}

const connectionSourceId = StickyId.create("stk_aaaaaaaaaaaa");
const connectionTargetId = StickyId.create("stk_bbbbbbbbbbbb");
const connectionId = ConnectionId.create("con_111111111111");
const missingConnectionId = ConnectionId.create("con_missing");
const connectionDocument = {
  ...Document.empty(),
  stickies: [
    {
      id: connectionSourceId,
      type: "event" as const,
      text: "A",
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
    },
    {
      id: connectionTargetId,
      type: "actor" as const,
      text: "B",
      position: { x: 1, y: 1 },
      size: { width: 1, height: 1 },
    },
  ],
  connections: [
    {
      id: connectionId,
      from: connectionSourceId,
      to: connectionTargetId,
      label: "old",
      note: "",
    },
  ],
};

it("Document.addConnectionは接続を採番して追加し、入力を変更しない", () => {
  const randomUUIDSpy = vi
    .spyOn(crypto, "randomUUID")
    .mockReturnValue("abcdef12-3456-7890-abcd-ef1234567890");
  const result = Document.addConnection(
    connectionDocument,
    connectionTargetId,
    connectionSourceId,
    "new",
  );
  expect(result.ok).toBe(true);
  const next = (result as { ok: true; value: Document }).value;

  expect(next.connections[1]).toEqual({
    id: ConnectionId.create("con_abcdef123456"),
    from: connectionTargetId,
    to: connectionSourceId,
    label: "new",
    note: "",
  });
  expect(connectionDocument.connections).toHaveLength(1);
  randomUUIDSpy.mockRestore();
});

it("Document.addConnectionは自己参照と存在しない端点を拒否する", () => {
  expect(
    Document.addConnection(
      connectionDocument,
      connectionSourceId,
      connectionSourceId,
    ),
  ).toMatchObject(
    { ok: false, error: { code: "SELF_REFERENTIAL_CONNECTION" } },
  );
  expect(
    Document.addConnection(
      connectionDocument,
      StickyId.create("stk_missing"),
      connectionSourceId,
    ),
  ).toMatchObject({
    ok: false,
    error: { code: "CONNECTION_SOURCE_NOT_FOUND" },
  });
  expect(
    Document.addConnection(
      connectionDocument,
      connectionSourceId,
      StickyId.create("stk_missing"),
    ),
  ).toMatchObject({
    ok: false,
    error: { code: "CONNECTION_TARGET_NOT_FOUND" },
  });
});

it("Document.addConnectionは同一ペアの複数接続を許容する", () => {
  const result = Document.addConnection(
    connectionDocument,
    connectionSourceId,
    connectionTargetId,
  );
  expect(result.ok).toBe(true);
  expect((result as { ok: true; value: Document }).value.connections).toHaveLength(
    2,
  );
});

it("Document.updateConnectionLabelはラベルを変更する", () => {
  const next = Document.updateConnectionLabel(
    connectionDocument,
    connectionId,
    "updated",
  );
  expect(next.connections[0].label).toBe("updated");
  expect(connectionDocument.connections[0].label).toBe("old");
  expect(
    Document.updateConnectionLabel(
      connectionDocument,
      missingConnectionId,
      "x",
    ),
  ).toBe(connectionDocument);
});

it("Document.updateConnectionAnchorsはアンカーを指定および解除する", () => {
  const anchored = Document.updateConnectionAnchors(
    connectionDocument,
    connectionId,
    "right",
    "left",
  );
  expect(anchored.connections[0]).toMatchObject({
    fromAnchor: "right",
    toAnchor: "left",
  });
  const automatic = Document.updateConnectionAnchors(anchored, connectionId);
  expect(automatic.connections[0].fromAnchor).toBeUndefined();
  expect(automatic.connections[0].toAnchor).toBeUndefined();
  expect(
    Document.updateConnectionAnchors(
      connectionDocument,
      missingConnectionId,
      "top",
      "bottom",
    ),
  ).toBe(connectionDocument);
});

it("Document.removeConnectionは接続を削除する", () => {
  const next = Document.removeConnection(connectionDocument, connectionId);
  expect(next.connections).toEqual([]);
  expect(connectionDocument.connections).toHaveLength(1);
  expect(
    Document.removeConnection(connectionDocument, missingConnectionId),
  ).toBe(connectionDocument);
});
