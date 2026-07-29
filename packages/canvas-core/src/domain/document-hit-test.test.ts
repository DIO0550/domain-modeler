import { expect, test } from "vitest";
import { Connection, ConnectionId } from "./connection";
import { type Document, Document as DocumentValue } from "./document";
import { ConnectionSegment } from "./connection-segment";
import { Sticky, StickyId } from "./sticky";

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
    ConnectionSegment.create(document, document.connections[0]),
  ).toEqual({
    some: true,
    value: {
      from: { x: 100, y: 50 },
      to: { x: 50, y: 50 },
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

  expect(ConnectionSegment.create(document, connection)).toEqual({
    some: true,
    value: {
      from: { x: 50, y: 0 },
      to: { x: 100, y: 80 },
    },
  });
});

test("許容距離以内の座標では接続を取得する", () => {
  const document = setupDocument();

  expect(DocumentValue.connectionAt(document, { x: 75, y: 57 }, 8)).toEqual({
    some: true,
    value: document.connections[0],
  });
});

test("許容距離を超える座標では接続を返さない", () => {
  expect(DocumentValue.connectionAt(setupDocument(), { x: 75, y: 59 }, 8)).toEqual({
    some: false,
  });
});

test("接続先の付箋が存在しない接続は判定対象にしない", () => {
  const document = setupDocument();
  const invalidDocument = { ...document, stickies: [document.stickies[0]] };

  expect(DocumentValue.connectionAt(invalidDocument, { x: 75, y: 50 }, 8)).toEqual({
    some: false,
  });
});
