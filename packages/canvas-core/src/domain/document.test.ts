import { describe, expect, it, vi } from "vitest";
import { DEFAULT_TITLE, Document } from "./document";
import type { Connection } from "./connection";
import { StickyId } from "./sticky";
import type { Sticky } from "./sticky";

describe("Document.empty", () => {
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
});

describe("Document sticky CRUD", () => {
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
      id: "con_111111111111",
      from: idA,
      to: idB,
      label: "",
      note: "",
    },
    {
      id: "con_222222222222",
      from: "stk_xxxxxxxxxxxx",
      to: "stk_yyyyyyyyyyyy",
      label: "",
      note: "",
    },
  ];

  const baseDocument = {
    ...Document.empty("My Canvas"),
    stickies,
    connections,
  };

  it("付箋を追加すると末尾(最前面)に配置され、入力を変更しない", () => {
    const randomUUIDSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("12345678-90ab-cdef-1234-567890abcdef");

    const next = Document.addSticky(
      baseDocument,
      "command",
      "new sticky",
      { x: 50, y: 60 },
      { width: 140, height: 100 },
    );

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
    const next = Document.resizeSticky(baseDocument, idA, {
      width: 200,
      height: 110,
    });

    expect(baseDocument.stickies[0].size).toEqual({ width: 100, height: 80 });
    expect(baseDocument).not.toBe(next);
    expect(next.stickies[0].size).toEqual({ width: 200, height: 110 });
  });

  it("リサイズで不正サイズを拒否する", () => {
    expect(() =>
      Document.resizeSticky(baseDocument, idA, {
        width: 0,
        height: 110,
      }),
    ).toThrowError("Sticky size must be positive");
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
    expect(() =>
      Document.addSticky(
        baseDocument,
        "command",
        "new sticky",
        { x: 50, y: 60 },
        { width: 140, height: 0 },
      ),
    ).toThrowError("Sticky size must be positive");
  });

  it("追加時に負のサイズを拒否する", () => {
    expect(() =>
      Document.addSticky(
        baseDocument,
        "command",
        "new sticky",
        { x: 50, y: 60 },
        { width: -1, height: 10 },
      ),
    ).toThrowError("Sticky size must be positive");
  });
});
