import { expect, test } from "vitest";
import { Serialize } from "./serialize";
import { StickyId } from "./domain/sticky";
import { ConnectionId } from "./domain/connection";
import type { Document } from "./domain/document";
import { Result } from "./domain/result";

const validDocumentJson = (): string =>
  JSON.stringify({
    version: "1.0",
    title: "注文ドメイン",
    viewport: { x: 10, y: 20, zoom: 1.5 },
    stickies: [
      {
        id: "stk_x7f3q9abcdef",
        type: "event",
        text: "注文が確定した",
        position: { x: 320, y: 180 },
        size: { width: 160, height: 100 },
      },
      {
        id: "stk_9k2m4pabcdef",
        type: "actor",
        text: "購入者",
        position: { x: 100, y: 180 },
        size: { width: 120, height: 80 },
      },
    ],
    connections: [
      {
        id: "con_a1b2c3abcdef",
        from: "stk_9k2m4pabcdef",
        to: "stk_x7f3q9abcdef",
        fromAnchor: "right",
        label: "確定後",
        note: "購入者 -> 注文が確定した",
      },
    ],
  });

test("妥当な JSON を読み込むと Document になる", () => {
  const document = Result.unwrap(Serialize.parse(validDocumentJson()));

  expect(document).toEqual({
    version: "1.0",
    title: "注文ドメイン",
    viewport: { x: 10, y: 20, zoom: 1.5 },
    stickies: [
      {
        id: StickyId.create("stk_x7f3q9abcdef"),
        type: "event",
        text: "注文が確定した",
        position: { x: 320, y: 180 },
        size: { width: 160, height: 100 },
      },
      {
        id: StickyId.create("stk_9k2m4pabcdef"),
        type: "actor",
        text: "購入者",
        position: { x: 100, y: 180 },
        size: { width: 120, height: 80 },
      },
    ],
    connections: [
      {
        id: ConnectionId.create("con_a1b2c3abcdef"),
        from: StickyId.create("stk_9k2m4pabcdef"),
        to: StickyId.create("stk_x7f3q9abcdef"),
        fromAnchor: "right",
        toAnchor: undefined,
        label: "確定後",
        note: "",
      },
    ],
  });
});

test("未知のトップレベルフィールドは無視して読み込む", () => {
  const document = Result.unwrap(
    Serialize.parse(
      JSON.stringify({
        version: "1.0",
        title: "注文ドメイン",
        viewport: { x: 0, y: 0, zoom: 1 },
        stickies: [],
        connections: [],
        futureField: { nested: true },
        anotherUnknown: 42,
      }),
    ),
  );

  expect(document).toEqual({
    version: "1.0",
    title: "注文ドメイン",
    viewport: { x: 0, y: 0, zoom: 1 },
    stickies: [],
    connections: [],
  });
  expect(document).not.toHaveProperty("futureField");
  expect(document).not.toHaveProperty("anotherUnknown");
});

test.each([
  { zoom: 0.05, expected: 0.1 },
  { zoom: 0.1, expected: 0.1 },
  { zoom: 4.0, expected: 4.0 },
  { zoom: 10, expected: 4.0 },
])(
  "viewport.zoom が $zoom のとき $expected にクランプする",
  ({ zoom, expected }: { zoom: number; expected: number }) => {
    const document = Result.unwrap(
      Serialize.parse(
        JSON.stringify({
          version: "1.0",
          title: "",
          viewport: { x: 0, y: 0, zoom },
          stickies: [],
          connections: [],
        }),
      ),
    );

    expect(document.viewport.zoom).toBe(expected);
  },
);

test("接続の note は読み込み時に無視して空文字にする", () => {
  const document = Result.unwrap(Serialize.parse(validDocumentJson()));

  expect(document.connections[0]?.note).toBe("");
});

test("major が一致し minor が既知より上でも未知フィールドを無視して読み込む", () => {
  const document = Result.unwrap(
    Serialize.parse(
      JSON.stringify({
        version: "1.5",
        title: "将来形式",
        viewport: { x: 1, y: 2, zoom: 1 },
        stickies: [],
        connections: [],
        experimental: true,
      }),
    ),
  );

  expect(document.version).toBe("1.5");
  expect(document).not.toHaveProperty("experimental");
});

test("アンカー省略の接続はアンカーなしで読み込む", () => {
  const document = Result.unwrap(
    Serialize.parse(
      JSON.stringify({
        version: "1.0",
        title: "",
        viewport: { x: 0, y: 0, zoom: 1 },
        stickies: [
          {
            id: "stk_aaaaaaaaaaaa",
            type: "command",
            text: "a",
            position: { x: 0, y: 0 },
            size: { width: 10, height: 10 },
          },
          {
            id: "stk_bbbbbbbbbbbb",
            type: "event",
            text: "b",
            position: { x: 20, y: 0 },
            size: { width: 10, height: 10 },
          },
        ],
        connections: [
          {
            id: "con_cccccccccccc",
            from: "stk_aaaaaaaaaaaa",
            to: "stk_bbbbbbbbbbbb",
            label: "",
            note: "ignored",
          },
        ],
      }),
    ),
  );

  expect(document.connections[0]).toEqual({
    id: ConnectionId.create("con_cccccccccccc"),
    from: StickyId.create("stk_aaaaaaaaaaaa"),
    to: StickyId.create("stk_bbbbbbbbbbbb"),
    fromAnchor: undefined,
    toAnchor: undefined,
    label: "",
    note: "",
  });
});

const sampleDocument = (): Document =>
  Result.unwrap(Serialize.parse(validDocumentJson()));

test("Document を書き出すとインデント2の JSON になる", () => {
  const json = Serialize.stringify(sampleDocument());

  expect(json.startsWith("{")).toBe(true);
  expect(json).toContain('\n  "version"');
});

test("書き出し時に接続の note を sticky テキストから再生成する", () => {
  const parsed = JSON.parse(Serialize.stringify(sampleDocument())) as {
    connections: Array<{ note: string }>;
  };

  expect(parsed.connections[0]?.note).toBe("購入者 -> 注文が確定した");
});

test("空の stickies と connections を書き出せる", () => {
  const document = Result.unwrap(
    Serialize.parse(
      JSON.stringify({
        version: "1.0",
        title: "",
        viewport: { x: 0, y: 0, zoom: 1 },
        stickies: [],
        connections: [],
      }),
    ),
  );

  const parsed = JSON.parse(Serialize.stringify(document)) as {
    stickies: unknown[];
    connections: unknown[];
  };

  expect(parsed.stickies).toEqual([]);
  expect(parsed.connections).toEqual([]);
});

test("Document トップレベルキーは version, title, viewport, stickies, connections の順になる", () => {
  const parsed = JSON.parse(Serialize.stringify(sampleDocument())) as object;

  expect(Object.keys(parsed)).toEqual([
    "version",
    "title",
    "viewport",
    "stickies",
    "connections",
  ]);
});

test("Viewport キーは x, y, zoom の順になる", () => {
  const parsed = JSON.parse(Serialize.stringify(sampleDocument())) as {
    viewport: object;
  };

  expect(Object.keys(parsed.viewport)).toEqual(["x", "y", "zoom"]);
});

test("Sticky キーは id, type, text, position, size の順になる", () => {
  const parsed = JSON.parse(Serialize.stringify(sampleDocument())) as {
    stickies: object[];
  };

  expect(Object.keys(parsed.stickies[0] ?? {})).toEqual([
    "id",
    "type",
    "text",
    "position",
    "size",
  ]);
});

test("Connection キーは id, from, to, fromAnchor?, toAnchor?, label, note の順になる", () => {
  const parsed = JSON.parse(Serialize.stringify(sampleDocument())) as {
    connections: object[];
  };

  expect(Object.keys(parsed.connections[0] ?? {})).toEqual([
    "id",
    "from",
    "to",
    "fromAnchor",
    "label",
    "note",
  ]);
});

test("アンカー省略の接続は書き出し JSON にアンカーキーを含めない", () => {
  const document = Result.unwrap(
    Serialize.parse(
      JSON.stringify({
        version: "1.0",
        title: "",
        viewport: { x: 0, y: 0, zoom: 1 },
        stickies: [
          {
            id: "stk_aaaaaaaaaaaa",
            type: "command",
            text: "a",
            position: { x: 0, y: 0 },
            size: { width: 10, height: 10 },
          },
          {
            id: "stk_bbbbbbbbbbbb",
            type: "event",
            text: "b",
            position: { x: 20, y: 0 },
            size: { width: 10, height: 10 },
          },
        ],
        connections: [
          {
            id: "con_cccccccccccc",
            from: "stk_aaaaaaaaaaaa",
            to: "stk_bbbbbbbbbbbb",
            label: "",
            note: "ignored",
          },
        ],
      }),
    ),
  );

  const parsed = JSON.parse(Serialize.stringify(document)) as {
    connections: Array<Record<string, unknown>>;
  };

  expect(Object.keys(parsed.connections[0] ?? {})).toEqual([
    "id",
    "from",
    "to",
    "label",
    "note",
  ]);
  expect(parsed.connections[0]).not.toHaveProperty("fromAnchor");
  expect(parsed.connections[0]).not.toHaveProperty("toAnchor");
});

test("書き出し version は常にアプリ最新の 1.0 になる", () => {
  const document = {
    ...sampleDocument(),
    version: "1.5",
  };
  const parsed = JSON.parse(Serialize.stringify(document)) as {
    version: string;
  };

  expect(parsed.version).toBe("1.0");
});

test("書き出し→読み込みで Document 構造が同値になる", () => {
  const original = sampleDocument();
  const roundTripped = Result.unwrap(
    Serialize.parse(Serialize.stringify(original)),
  );

  expect(roundTripped).toEqual(original);
});

test("往復後も接続の note は空文字になる", () => {
  const roundTripped = Result.unwrap(
    Serialize.parse(Serialize.stringify(sampleDocument())),
  );

  expect(roundTripped.connections[0]?.note).toBe("");
});
