import { describe, expect, it, vi } from "vitest";
import { DEFAULT_TITLE, Document } from "./document";
import type { Connection } from "./connection";
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
  const stickies: readonly Sticky[] = [
    {
      id: "stk_aaaaaaaaaaaa",
      type: "event",
      text: "first",
      position: { x: 10, y: 20 },
      size: { width: 100, height: 80 },
    },
    {
      id: "stk_bbbbbbbbbbbb",
      type: "actor",
      text: "second",
      position: { x: 30, y: 40 },
      size: { width: 120, height: 90 },
    },
  ];

  const connections: readonly Connection[] = [
    {
      id: "con_111111111111",
      from: "stk_aaaaaaaaaaaa",
      to: "stk_bbbbbbbbbbbb",
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
    expect(next.stickies).toHaveLength(3);
    expect(next.stickies[next.stickies.length - 1]).toEqual({
      id: "stk_1234567890ab",
      type: "command",
      text: "new sticky",
      position: { x: 50, y: 60 },
      size: { width: 140, height: 100 },
    });

    randomUUIDSpy.mockRestore();
  });

  it("付箋本文を変更でき、入力を変更しない", () => {
    const next = Document.updateStickyText(
      baseDocument,
      "stk_aaaaaaaaaaaa",
      "updated",
    );

    expect(baseDocument.stickies[0].text).toBe("first");
    expect(next.stickies[0].text).toBe("updated");
    expect(next.stickies[1]).toEqual(baseDocument.stickies[1]);
  });

  it("付箋を移動でき、入力を変更しない", () => {
    const next = Document.moveSticky(baseDocument, "stk_aaaaaaaaaaaa", {
      x: 111,
      y: 222,
    });

    expect(baseDocument.stickies[0].position).toEqual({ x: 10, y: 20 });
    expect(next.stickies[0].position).toEqual({ x: 111, y: 222 });
  });

  it("付箋をリサイズできる", () => {
    const next = Document.resizeSticky(baseDocument, "stk_aaaaaaaaaaaa", {
      width: 200,
      height: 110,
    });

    expect(next.stickies[0].size).toEqual({ width: 200, height: 110 });
  });

  it("リサイズで不正サイズを拒否する", () => {
    expect(() =>
      Document.resizeSticky(baseDocument, "stk_aaaaaaaaaaaa", {
        width: 0,
        height: 110,
      }),
    ).toThrowError("Sticky size must be positive");
  });

  it("付箋種別を変更できる", () => {
    const next = Document.changeStickyType(
      baseDocument,
      "stk_aaaaaaaaaaaa",
      "policy",
    );

    expect(next.stickies[0].type).toBe("policy");
  });

  it("付箋を前面化すると配列末尾へ移動する", () => {
    const next = Document.bringStickyToFront(baseDocument, "stk_aaaaaaaaaaaa");

    expect(next.stickies.map((sticky) => sticky.id)).toEqual([
      "stk_bbbbbbbbbbbb",
      "stk_aaaaaaaaaaaa",
    ]);
  });

  it("付箋削除時に関連接続をカスケード削除する", () => {
    const next = Document.removeSticky(baseDocument, "stk_aaaaaaaaaaaa");

    expect(next.stickies.map((sticky) => sticky.id)).toEqual([
      "stk_bbbbbbbbbbbb",
    ]);
    expect(next.connections.map((connection) => connection.id)).toEqual([
      "con_222222222222",
    ]);
    expect(baseDocument.connections).toHaveLength(2);
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
});
