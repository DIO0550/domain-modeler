import { expect, test } from "vitest";
import { Connection, ConnectionId } from "../../connection";
import { type Document, Document as DocumentValue } from "..";
import { ConnectionSegment } from "../../connection-segment";
import { Sticky, StickyId } from "../../sticky";
import { StickyIndex } from "../../sticky-index";

const backId = StickyId.create("stk_back");
const frontId = StickyId.create("stk_front");
const connectionId = ConnectionId.create("con_1");

/**
 * 当たり判定に使用する文書を生成する。
 * @returns 重なった付箋と接続を持つ文書。
 */
const setupDocument = (): Document => ({
  ...DocumentValue.empty(),
  stickies: [
    Sticky.create(
      backId,
      "event",
      "back",
      { x: 0, y: 0 },
      { width: 100, height: 100 },
    ),
    Sticky.create(
      frontId,
      "command",
      "front",
      { x: 50, y: 20 },
      { width: 100, height: 60 },
    ),
  ],
  connections: [
    Connection.create(connectionId, backId, frontId, "", ""),
  ],
});

test("付箋の境界を含む矩形内では最前面の付箋を取得する", () => {
  const hit = DocumentValue.stickyAt(setupDocument(), { x: 50, y: 20 });

  expect(hit).toEqual({ some: true, value: setupDocument().stickies[1] });
});

test("付箋がない座標では値を返さない", () => {
  expect(DocumentValue.stickyAt(setupDocument(), { x: 200, y: 200 })).toEqual({
    some: false,
  });
});

test("付箋の中心を結ぶ直線と各矩形の辺から自動アンカーを解決する", () => {
  const document = setupDocument();

  expect(
    ConnectionSegment.create(
      StickyIndex.create(document.stickies),
      document.connections[0],
    ),
  ).toEqual({
    some: true,
    value: {
      from: { x: 100, y: 50 },
      to: { x: 50, y: 50 },
      fromOutwardNormal: { x: 1, y: 0 },
      toOutwardNormal: { x: -1, y: 0 },
    },
  });
});

test("明示したアンカーは自動アンカーより優先する", () => {
  const document = setupDocument();
  const connection = Connection.create(
    connectionId,
    backId,
    frontId,
    "",
    "",
    "top",
    "bottom",
  );

  expect(
    ConnectionSegment.create(StickyIndex.create(document.stickies), connection),
  ).toEqual({
    some: true,
    value: {
      from: { x: 50, y: 0 },
      to: { x: 100, y: 80 },
      fromOutwardNormal: { x: 0, y: -1 },
      toOutwardNormal: { x: 0, y: 1 },
    },
  });
});

test.each([
  {
    anchor: "top" as const,
    expected: { x: 50, y: 0 },
  },
  {
    anchor: "right" as const,
    expected: { x: 100, y: 50 },
  },
  {
    anchor: "bottom" as const,
    expected: { x: 50, y: 100 },
  },
  {
    anchor: "left" as const,
    expected: { x: 0, y: 50 },
  },
])("明示した各アンカーは対応する辺の中央に解決する", ({ anchor, expected }) => {
  const sticky = setupDocument().stickies[0];

  expect(Sticky.anchorPoint(sticky, anchor)).toEqual(expected);
});

test.each([
  { point: { x: 50, y: 0 }, expected: { x: 0, y: -1 } },
  { point: { x: 100, y: 50 }, expected: { x: 1, y: 0 } },
  { point: { x: 50, y: 100 }, expected: { x: 0, y: 1 } },
  { point: { x: 0, y: 50 }, expected: { x: -1, y: 0 } },
])("付箋の各辺上の座標から外向き法線を取得する", ({ point, expected }) => {
  const sticky = setupDocument().stickies[0];

  expect(Sticky.outwardNormal(sticky, point)).toEqual(expected);
});

test("許容距離以内の座標では接続を取得する", () => {
  const document = setupDocument();

  expect(DocumentValue.connectionAt(document, { x: 75, y: 57 }, 8)).toEqual({
    some: true,
    value: document.connections[0],
  });
});

test("許容距離を超える座標では接続を返さない", () => {
  expect(
    DocumentValue.connectionAt(setupDocument(), { x: 75, y: 59 }, 8),
  ).toEqual({
    some: false,
  });
});

test("複数の接続が許容距離内にある場合は最後に追加した接続を取得する", () => {
  const document = setupDocument();
  const frontConnection = Connection.create(
    ConnectionId.create("con_front"),
    backId,
    frontId,
    "front",
    "",
  );
  const documentWithOverlappingConnections = {
    ...document,
    connections: [...document.connections, frontConnection],
  };

  expect(
    DocumentValue.connectionAt(
      documentWithOverlappingConnections,
      { x: 75, y: 50 },
      8,
    ),
  ).toEqual({ some: true, value: frontConnection });
});

test("接続先の付箋が存在しない接続は判定対象にしない", () => {
  const document = setupDocument();
  const invalidDocument = { ...document, stickies: [document.stickies[0]] };

  expect(
    DocumentValue.connectionAt(invalidDocument, { x: 75, y: 50 }, 8),
  ).toEqual({
    some: false,
  });
});
