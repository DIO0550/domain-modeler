import { expect, test } from "vitest";
import { Connection, ConnectionId } from "../../connection";
import { type Document, Document as DocumentValue } from "../../document";
import { ConnectionSegment } from "..";
import { Sticky, StickyId } from "../../sticky";
import { StickyIndex } from "../../sticky-index";

const fromId = StickyId.create("stk_from");
const toId = StickyId.create("stk_to");

const setupDocument = (): Document => ({
  ...DocumentValue.empty(),
  stickies: [
    Sticky.create(
      fromId,
      "actor",
      "from",
      { x: 20, y: 40 },
      { width: 120, height: 80 },
    ),
    Sticky.create(
      toId,
      "command",
      "to",
      { x: 260, y: 30 },
      { width: 160, height: 100 },
    ),
  ],
  connections: [],
});

test("向かい合うアンカーを水平に結べる接続は直線経路になる", () => {
  const document = setupDocument();
  const connection = Connection.create(
    ConnectionId.create("con_straight"),
    fromId,
    toId,
    "",
    "",
    "right",
    "left",
  );
  const segment = ConnectionSegment.create(
    StickyIndex.create(document.stickies),
    connection,
  );

  expect(segment.some).toBe(true);
  if (!segment.some) {
    return;
  }
  expect(ConnectionSegment.toRoute(segment.value)).toEqual({
    shape: "straight",
    path: "M 140 80 L 260 80",
    midpoint: { x: 200, y: 80 },
  });
});

test("向かい合わないアンカーの接続は辺の法線方向へ出る三次ベジェ曲線になる", () => {
  const document = setupDocument();
  const connection = Connection.create(
    ConnectionId.create("con_curve"),
    fromId,
    toId,
    "",
    "",
    "bottom",
    "top",
  );
  const segment = ConnectionSegment.create(
    StickyIndex.create(document.stickies),
    connection,
  );

  expect(segment.some).toBe(true);
  if (!segment.some) {
    return;
  }
  expect(ConnectionSegment.toRoute(segment.value)).toEqual({
    shape: "curve",
    path: "M 80 120 C 80 230.055, 340 -80.055, 340 30",
    midpoint: { x: 210, y: 75 },
  });
});

test("SVG経路の座標は小数第3位に丸める", () => {
  const route = ConnectionSegment.toStraightRoute({
    from: { x: 1.23456, y: 2.34567 },
    to: { x: 3.45678, y: 4.56789 },
    fromOutwardNormal: { x: 1, y: 0 },
    toOutwardNormal: { x: -1, y: 0 },
  });

  expect(route.path).toBe("M 1.235 2.346 L 3.457 4.568");
});

test("曲線上の座標は接続線の許容距離内になる", () => {
  const document = setupDocument();
  const connection = Connection.create(
    ConnectionId.create("con_curve_hit"),
    fromId,
    toId,
    "",
    "",
    "bottom",
    "top",
  );
  const segment = ConnectionSegment.create(
    StickyIndex.create(document.stickies),
    connection,
  );

  expect(segment.some).toBe(true);
  if (!segment.some) {
    return;
  }
  expect(
    ConnectionSegment.contains(
      segment.value,
      { x: 120.625, y: 136.89046875 },
      8,
    ),
  ).toBe(true);
});

test("曲線から離れた始点と終点を結ぶ直線上の座標は許容距離外になる", () => {
  const document = setupDocument();
  const connection = Connection.create(
    ConnectionId.create("con_curve_chord"),
    fromId,
    toId,
    "",
    "",
    "bottom",
    "top",
  );
  const segment = ConnectionSegment.create(
    StickyIndex.create(document.stickies),
    connection,
  );

  expect(segment.some).toBe(true);
  if (!segment.some) {
    return;
  }

  expect(
    ConnectionSegment.contains(segment.value, { x: 145, y: 97.5 }, 8),
  ).toBe(false);
});
