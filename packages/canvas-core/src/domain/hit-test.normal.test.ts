import { expect, test } from "vitest";
import { Connection, ConnectionId } from "./connection";
import { type Document, Document as DocumentValue } from "./document";
import { ConnectionSegment } from "./connection-segment";
import { Sticky, StickyId } from "./sticky";
import { HitTest } from "./hit-test";

const backId = StickyId.create("stk_back");
const frontId = StickyId.create("stk_front");
const connectionId = ConnectionId.create("con_1");

/**
 * ヒットテストに使用する文書を生成する。
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

test("付箋: 境界を含む矩形内では最前面の付箋を取得する", () => {
  const hit = HitTest.stickyAt(setupDocument(), { x: 50, y: 20 });

  expect(hit).toEqual({ some: true, value: setupDocument().stickies[1] });
});

test("付箋: 付箋がない座標では値を返さない", () => {
  expect(HitTest.stickyAt(setupDocument(), { x: 200, y: 200 })).toEqual({
    some: false,
  });
});

test("付箋: 複数の付箋が重なる場合は最前面（配列後方）を取得する", () => {
  const doc = setupDocument();
  const overlappingPoint = { x: 75, y: 50 };

  const hit = HitTest.stickyAt(doc, overlappingPoint);

  expect(hit).toEqual({
    some: true,
    value: expect.objectContaining({ id: frontId }),
  });
});

test("接続線: 許容距離以内の座標では接続を取得する", () => {
  const doc = setupDocument();
  const screenTolerance = 8; // 画面上の許容距離（px）
  const zoom = 1; // ズーム倍率
  const tolerance = screenTolerance / zoom; // 呼び出し側で zoom 換算

  expect(HitTest.connectionAt(doc, { x: 75, y: 57 }, tolerance)).toEqual({
    some: true,
    value: doc.connections[0],
  });
});

test("接続線: 許容距離を超える座標では接続を返さない", () => {
  const doc = setupDocument();
  const screenTolerance = 8;
  const zoom = 1;
  const tolerance = screenTolerance / zoom;

  expect(HitTest.connectionAt(doc, { x: 75, y: 59 }, tolerance)).toEqual({
    some: false,
  });
});

test("接続線: zoom 換算を呼び出し側で実装する前提 - zoom 2.0 のとき許容距離は 4", () => {
  const doc = setupDocument();
  const screenTolerance = 8; // 画面上の固定許容距離
  const zoom = 2.0; // ズーム倍率
  const tolerance = screenTolerance / zoom; // = 4

  // zoom 2.0 のとき、ワールド座標での許容距離は 4
  // 元の接続線は (100, 50) → (50, 50)
  // 点 (75, 55) は、ワールド距離で 5 離れているため、許容値 4 では取得されない
  expect(HitTest.connectionAt(doc, { x: 75, y: 55 }, tolerance)).toEqual({
    some: false,
  });
});

test("接続線: 複数の接続が許容距離内にある場合は最後に追加した接続を取得する", () => {
  const doc = setupDocument();
  const frontConnection = Connection.create(
    ConnectionId.create("con_front"),
    backId,
    frontId,
    "front",
    "",
  );
  const docWithOverlappingConnections = {
    ...doc,
    connections: [...doc.connections, frontConnection],
  };

  const screenTolerance = 8;
  const zoom = 1;
  const tolerance = screenTolerance / zoom;

  expect(
    HitTest.connectionAt(docWithOverlappingConnections, { x: 75, y: 50 }, tolerance),
  ).toEqual({ some: true, value: frontConnection });
});

test("接続線: 接続先の付箋が存在しない接続は判定対象にしない", () => {
  const doc = setupDocument();
  const invalidDoc = { ...doc, stickies: [doc.stickies[0]] };

  const screenTolerance = 8;
  const zoom = 1;
  const tolerance = screenTolerance / zoom;

  expect(HitTest.connectionAt(invalidDoc, { x: 75, y: 50 }, tolerance)).toEqual({
    some: false,
  });
});

test("アンカー: 明示したアンカーは自動アンカーより優先する", () => {
  const doc = setupDocument();
  const connection = Connection.create(
    connectionId,
    backId,
    frontId,
    "",
    "",
    "top",
    "bottom",
  );

  expect(ConnectionSegment.create(doc, connection)).toEqual({
    some: true,
    value: {
      from: { x: 50, y: 0 },
      to: { x: 100, y: 80 },
    },
  });
});

test("アンカー: 2つの付箋の中心を結ぶ直線と各矩形の辺から自動アンカーを解決する", () => {
  const doc = setupDocument();

  expect(ConnectionSegment.create(doc, doc.connections[0])).toEqual({
    some: true,
    value: {
      from: { x: 100, y: 50 },
      to: { x: 50, y: 50 },
    },
  });
});

test("アンカー: 各辺に対して正しいアンカー座標を計算する", () => {
  const sticky = setupDocument().stickies[0];

  const testCases = [
    { anchor: "top" as const, expected: { x: 50, y: 0 } },
    { anchor: "right" as const, expected: { x: 100, y: 50 } },
    { anchor: "bottom" as const, expected: { x: 50, y: 100 } },
    { anchor: "left" as const, expected: { x: 0, y: 50 } },
  ];

  testCases.forEach(({ anchor, expected }) => {
    expect(Sticky.anchorPoint(sticky, anchor)).toEqual(expected);
  });
});

test("距離計算: 接続線からの最短距離を取得する", () => {
  const doc = setupDocument();
  const connection = doc.connections[0];
  const point = { x: 75, y: 57 };

  const distance = HitTest.distanceToConnection(doc, connection, point);

  expect(distance.some).toBe(true);
  expect((distance as { some: true; value: number }).value).toBeLessThan(8);
});

test("距離計算: 接続線が生成できない場合は値なし", () => {
  const doc = setupDocument();
  const invalidConnection = Connection.create(
    ConnectionId.create("con_invalid"),
    StickyId.create("stk_nonexistent_1"),
    StickyId.create("stk_nonexistent_2"),
    "",
    "",
  );

  expect(HitTest.distanceToConnection(doc, invalidConnection, { x: 0, y: 0 })).toEqual({
    some: false,
  });
});
