import { describe, expect, it } from "vitest";
import { DEFAULT_TITLE, Document } from "./document";

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
