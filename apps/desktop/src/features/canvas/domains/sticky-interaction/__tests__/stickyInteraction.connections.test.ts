import { expect, test } from "vitest";
import {
  Connection,
  ConnectionId,
  Document,
  Result,
  Serialize,
  Sticky,
  StickyId,
  STICKY_TYPES,
} from "@domain-modeler/canvas-core";
import { StickyInteraction } from "../index";

const from = Sticky.create(
  StickyId.create("stk_source000000"),
  STICKY_TYPES.event,
  "source",
  { x: 0, y: 0 },
  { width: 160, height: 100 },
);
const to = Sticky.create(
  StickyId.create("stk_target000000"),
  STICKY_TYPES.command,
  "target",
  { x: 300, y: 0 },
  { width: 160, height: 100 },
);
const connection = Connection.create(
  ConnectionId.create("con_auto00000000"),
  from.id,
  to.id,
  "label",
  "note",
  "right",
  "left",
);
const document: Document = {
  ...Document.empty(),
  stickies: [from, to],
  connections: [connection],
};

for (const scenario of [
  {
    id: from.id,
    position: { x: 300, y: -300 },
    fromAnchor: "bottom",
    toAnchor: "top",
  },
  {
    id: from.id,
    position: { x: 600, y: 0 },
    fromAnchor: "left",
    toAnchor: "right",
  },
  {
    id: to.id,
    position: { x: 0, y: 300 },
    fromAnchor: "bottom",
    toAnchor: "top",
  },
  {
    id: to.id,
    position: { x: 0, y: -300 },
    fromAnchor: "top",
    toAnchor: "bottom",
  },
]) {
  test(`付箋${scenario.id}を${JSON.stringify(scenario.position)}へ動かすと両端が近い辺に切り替わる`, () => {
    const moved = Document.moveSticky(document, scenario.id, scenario.position);
    expect(moved.connections[0]).toEqual({
      ...connection,
      fromAnchor: scenario.fromAnchor,
      toAnchor: scenario.toAnchor,
    });
    expect(document.connections[0]).toBe(connection);
  });
}

test("ドラッグ中の接続変更を確定し、undo/redoと保存読込で位置と両端を復元する", () => {
  const dragging = StickyInteraction.beginDrag(
    StickyInteraction.create(document),
    from.id,
    { x: 80, y: 50 },
  );
  const moved = StickyInteraction.movePointer(dragging, { x: 380, y: 350 });
  expect(moved.workingDocument.connections[0]).toMatchObject({
    fromAnchor: "top",
    toAnchor: "bottom",
  });
  expect(StickyInteraction.hasUndo(moved)).toBe(false);
  const committed = StickyInteraction.commitManipulation(moved);
  const undone = StickyInteraction.undo(committed);
  expect(undone.workingDocument).toEqual(document);
  const redone = StickyInteraction.redo(undone);
  expect(redone.workingDocument).toEqual(committed.workingDocument);
  const restored = Result.unwrap(
    Serialize.parse(Serialize.stringify(redone.workingDocument)),
  );
  expect(restored.stickies).toEqual(redone.workingDocument.stickies);
  expect(restored.connections[0]).toMatchObject({
    fromAnchor: "top",
    toAnchor: "bottom",
  });
});

test("ドラッグの取消で位置と接続先の辺を一緒に戻す", () => {
  const dragging = StickyInteraction.beginDrag(
    StickyInteraction.create(document),
    from.id,
    { x: 80, y: 50 },
  );
  const moved = StickyInteraction.movePointer(dragging, { x: 380, y: 350 });
  expect(StickyInteraction.cancelManipulation(moved).workingDocument).toEqual(
    document,
  );
});

test("関連する複数の接続を付け直し、関係ない接続と欠損した接続を維持する", () => {
  const extra = {
    ...from,
    id: StickyId.create("stk_extra0000000"),
    position: { x: 600, y: 0 },
  };
  const incoming = {
    ...connection,
    id: ConnectionId.create("con_incoming0000"),
    from: extra.id,
    to: from.id,
  };
  const unrelated = {
    ...connection,
    id: ConnectionId.create("con_unrelated000"),
    from: to.id,
    to: extra.id,
  };
  const missing = {
    ...connection,
    id: ConnectionId.create("con_missing00000"),
    to: StickyId.create("stk_missing00000"),
  };
  const moved = Document.moveSticky(
    {
      ...document,
      stickies: [...document.stickies, extra],
      connections: [connection, incoming, unrelated, missing],
    },
    from.id,
    { x: 600, y: 300 },
  );
  expect(moved.connections[1]).toMatchObject({
    fromAnchor: "bottom",
    toAnchor: "top",
  });
  expect(moved.connections[2]).toBe(unrelated);
  expect(moved.connections[3]).toBe(missing);
});

test("サイズ変更後の辺中央に対しても最短の両端を選び直す", () => {
  const before = {
    ...document,
    stickies: [from, { ...to, position: { x: 200, y: 200 } }],
  };
  const resized = Result.unwrap(
    Document.resizeSticky(before, from.id, { width: 560, height: 100 }),
  );
  expect(resized.connections[0]).toMatchObject({
    fromAnchor: "bottom",
    toAnchor: "top",
  });
});
