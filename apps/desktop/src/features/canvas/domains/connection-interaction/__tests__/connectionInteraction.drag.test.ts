import { expect, test } from "vitest";
import {
  ANCHORS,
  Result,
  Serialize,
  Document,
  Sticky,
  StickyId,
  STICKY_TYPES,
} from "@domain-modeler/canvas-core";
import { ConnectionInteraction } from "..";

const source = Sticky.create(
  StickyId.create("stk_source00000"),
  STICKY_TYPES.actor,
  "購入者",
  { x: 20, y: 20 },
  { width: 120, height: 80 },
);
const target = Sticky.create(
  StickyId.create("stk_target00000"),
  STICKY_TYPES.command,
  "注文する",
  { x: 240, y: 20 },
  { width: 160, height: 100 },
);
const setup = () =>
  ConnectionInteraction.clickAt(
    ConnectionInteraction.create({
      ...Document.empty(),
      stickies: [source, target],
    }),
    { x: 40, y: 40 },
  );

for (const anchor of Object.values(ANCHORS)) {
  test(`${anchor}辺からドラッグしても相手に最も近い辺で接続が確定する`, () => {
    const initial = setup();
    const started = ConnectionInteraction.beginConnectionDrag(initial, {
      stickyId: source.id,
      anchor,
    });
    const moved = ConnectionInteraction.moveConnectionDrag(started, {
      x: 270,
      y: 50,
    });
    expect(moved.session).toMatchObject({
      status: "dragging",
      origin: Sticky.anchorPoint(source, anchor),
      point: { x: 270, y: 50 },
    });
    expect(moved.board.history).toBe(initial.board.history);
    const finished = ConnectionInteraction.finishConnectionDrag(moved, {
      x: 270,
      y: 50,
    });
    expect(finished.board.workingDocument.connections).toHaveLength(1);
    expect(finished.board.workingDocument.connections[0]).toMatchObject({
      from: source.id,
      to: target.id,
      fromAnchor: "right",
    });
    expect(finished.board.workingDocument.stickies).toEqual(
      initial.board.workingDocument.stickies,
    );
    expect(finished.board.session).toEqual(initial.board.session);
  });
}

for (const point of [
  { x: 600, y: 400 },
  { x: 40, y: 40 },
]) {
  test(`接続先のない場所または自分自身へのドロップでは文書と履歴を変更しない (${point.x})`, () => {
    const initial = setup();
    const started = ConnectionInteraction.beginConnectionDrag(initial, {
      stickyId: source.id,
      anchor: "right",
    });
    const finished = ConnectionInteraction.finishConnectionDrag(started, point);
    expect(finished.session.status).toBe("idle");
    expect(finished.board).toBe(initial.board);
  });
}

test("取消後にポインターを離しても接続は残らない", () => {
  const initial = setup();
  const started = ConnectionInteraction.beginConnectionDrag(initial, {
    stickyId: source.id,
    anchor: "top",
  });
  const cancelled = ConnectionInteraction.pressEscape(started);
  expect(
    ConnectionInteraction.finishConnectionDrag(cancelled, { x: 270, y: 50 })
      .board,
  ).toBe(initial.board);
});

test("連続して作成した接続は一つずつundoとredoできる", () => {
  const initial = setup();
  const first = ConnectionInteraction.finishConnectionDrag(
    ConnectionInteraction.beginConnectionDrag(initial, {
      stickyId: source.id,
      anchor: "right",
    }),
    { x: 270, y: 50 },
  );
  const second = ConnectionInteraction.finishConnectionDrag(
    ConnectionInteraction.beginConnectionDrag(first, {
      stickyId: source.id,
      anchor: "bottom",
    }),
    { x: 270, y: 50 },
  );
  expect(second.board.workingDocument.connections).toHaveLength(2);
  const undone = ConnectionInteraction.undo(second);
  expect(undone.board.workingDocument.connections).toEqual(
    first.board.workingDocument.connections,
  );
  expect(
    ConnectionInteraction.redo(undone).board.workingDocument.connections,
  ).toEqual(second.board.workingDocument.connections);
});

test("保存して読み直しても接続の始点の辺を維持する", () => {
  const created = ConnectionInteraction.finishConnectionDrag(
    ConnectionInteraction.beginConnectionDrag(setup(), {
      stickyId: source.id,
      anchor: "bottom",
    }),
    { x: 270, y: 50 },
  );
  const parsed = Result.unwrap(
    Serialize.parse(Serialize.stringify(created.board.workingDocument)),
  );
  expect(parsed.connections[0]?.fromAnchor).toBe("right");
});

for (const anchor of Object.values(ANCHORS)) {
  test(`接続先の${anchor}辺付近で離しても始点に最も近い左辺へ接続する`, () => {
    const point = Sticky.anchorPoint(target, anchor);
    const started = ConnectionInteraction.beginConnectionDrag(setup(), {
      stickyId: source.id,
      anchor: "right",
    });
    const moved = ConnectionInteraction.moveConnectionDrag(started, point);
    expect(moved.session).toMatchObject({
      target: {
        some: true,
        value: {
          stickyId: target.id,
          anchor: "left",
          point: Sticky.anchorPoint(target, "left"),
        },
      },
    });
    const finished = ConnectionInteraction.finishConnectionDrag(moved, point);
    expect(finished.board.workingDocument.connections[0]).toMatchObject({
      to: target.id,
      toAnchor: "left",
    });
    const parsed = Result.unwrap(
      Serialize.parse(Serialize.stringify(finished.board.workingDocument)),
    );
    expect(parsed.connections[0]?.toAnchor).toBe("left");
  });
}

test("付箋の少し外で離しても近い辺中央へ接続する", () => {
  const started = ConnectionInteraction.beginConnectionDrag(setup(), {
    stickyId: source.id,
    anchor: "right",
  });
  const finished = ConnectionInteraction.finishConnectionDrag(started, {
    x: 225,
    y: 70,
  });
  expect(finished.board.workingDocument.connections[0]).toMatchObject({
    to: target.id,
    toAnchor: "left",
  });
});

test("拡大後の近接範囲も画面上24pxを超えない", () => {
  const initial = ConnectionInteraction.clickAt(
    ConnectionInteraction.create({
      ...Document.empty(),
      viewport: { x: 0, y: 0, zoom: 2 },
      stickies: [source, target],
    }),
    { x: 40, y: 40 },
  );
  const started = ConnectionInteraction.beginConnectionDrag(initial, {
    stickyId: source.id,
    anchor: "right",
  });
  expect(
    ConnectionInteraction.moveConnectionDrag(started, { x: 227, y: 70 })
      .session,
  ).toMatchObject({ target: { some: false } });
  expect(
    ConnectionInteraction.moveConnectionDrag(started, { x: 228, y: 70 })
      .session,
  ).toMatchObject({ target: { some: true } });
});

for (const direction of [
  { position: { x: 240, y: 20 }, from: "right", to: "left" },
  { position: { x: -240, y: 20 }, from: "left", to: "right" },
  { position: { x: 20, y: -240 }, from: "top", to: "bottom" },
  { position: { x: 20, y: 240 }, from: "bottom", to: "top" },
] as const) {
  test(`相手の位置に応じて${direction.from}から${direction.to}へ自動接続する`, () => {
    const movedTarget = { ...target, position: direction.position };
    const initial = ConnectionInteraction.clickAt(
      ConnectionInteraction.create({
        ...Document.empty(),
        stickies: [source, movedTarget],
      }),
      { x: 40, y: 40 },
    );
    const started = ConnectionInteraction.beginConnectionDrag(initial, {
      stickyId: source.id,
      anchor: "right",
    });
    const result = ConnectionInteraction.finishConnectionDrag(
      started,
      Sticky.center(movedTarget),
    );
    expect(result.board.workingDocument.connections[0]).toMatchObject({
      fromAnchor: direction.from,
      toAnchor: direction.to,
    });
  });
}
