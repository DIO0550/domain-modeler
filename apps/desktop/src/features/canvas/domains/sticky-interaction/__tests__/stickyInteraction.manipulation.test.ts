import { expect, test } from "vitest";
import {
  Document,
  Sticky,
  StickyId,
  STICKY_TYPES,
  type Sticky as StickyModel,
} from "@domain-modeler/canvas-core";
import {
  STICKY_RESIZE_CORNERS,
  StickyInteraction,
  type StickyResizeCorner,
} from "../index";

const draggedId = StickyId.create("stk_dragged00000");
const frontId = StickyId.create("stk_front0000000");
const draggedSticky = Sticky.create(
  draggedId,
  STICKY_TYPES.event,
  "注文が確定した",
  { x: 10, y: 20 },
  { width: 160, height: 100 },
);
const frontSticky = Sticky.create(
  frontId,
  STICKY_TYPES.command,
  "メールを送る",
  { x: 240, y: 20 },
  { width: 160, height: 100 },
);
const documentWithTwoStickies = {
  ...Document.empty(),
  stickies: [draggedSticky, frontSticky],
};

/**
 * 文書内の対象付箋を返す。テスト対象が付箋を消した場合は開始時の付箋を返す。
 *
 * @param document 対象文書。
 * @param stickyId 対象付箋 ID。
 * @returns 現在の付箋、または開始時の付箋。
 */
const stickyIn = (document: Document, stickyId: StickyId): StickyModel => {
  const sticky = Document.stickyById(document, stickyId);
  return sticky.some ? sticky.value : draggedSticky;
};

test("付箋をドラッグし始めると最前面へ移動する", () => {
  const dragging = StickyInteraction.beginDrag(
    StickyInteraction.create(documentWithTwoStickies),
    draggedId,
    { x: 20, y: 30 },
  );

  expect(dragging.workingDocument.stickies.map((sticky) => sticky.id)).toEqual([
    frontId,
    draggedId,
  ]);
  expect(dragging.session.status).toBe("dragging");
});

test("連続してドラッグしても確定までは履歴へ積まない", () => {
  const dragging = StickyInteraction.beginDrag(
    StickyInteraction.create(documentWithTwoStickies),
    draggedId,
    { x: 20, y: 30 },
  );
  const moved = StickyInteraction.movePointer(
    StickyInteraction.movePointer(dragging, { x: 40, y: 50 }),
    { x: 60, y: 80 },
  );

  expect(stickyIn(moved.workingDocument, draggedId).position).toEqual({
    x: 50,
    y: 70,
  });
  expect(StickyInteraction.hasUndo(moved)).toBe(false);
});

test("連続ドラッグを確定するとundo 1回で開始前の位置と重なり順へ戻る", () => {
  const dragging = StickyInteraction.beginDrag(
    StickyInteraction.create(documentWithTwoStickies),
    draggedId,
    { x: 20, y: 30 },
  );
  const moved = StickyInteraction.movePointer(
    StickyInteraction.movePointer(dragging, { x: 40, y: 50 }),
    { x: 60, y: 80 },
  );
  const committed = StickyInteraction.commitManipulation(moved);
  const undone = StickyInteraction.undo(committed);

  expect(stickyIn(committed.workingDocument, draggedId).position).toEqual({
    x: 50,
    y: 70,
  });
  expect(undone.workingDocument).toEqual(documentWithTwoStickies);
  expect(StickyInteraction.hasUndo(undone)).toBe(false);
});

test("最前面の付箋を動かさずに離すと履歴へ積まない", () => {
  const dragging = StickyInteraction.beginDrag(
    StickyInteraction.create(documentWithTwoStickies),
    frontId,
    { x: 250, y: 30 },
  );
  const committed = StickyInteraction.commitManipulation(dragging);

  expect(StickyInteraction.hasUndo(committed)).toBe(false);
  expect(committed.workingDocument).toBe(documentWithTwoStickies);
});

test("ドラッグを取り消すと開始前の位置と重なり順へ戻して履歴へ積まない", () => {
  const dragging = StickyInteraction.beginDrag(
    StickyInteraction.create(documentWithTwoStickies),
    draggedId,
    { x: 20, y: 30 },
  );
  const moved = StickyInteraction.movePointer(dragging, { x: 60, y: 80 });
  const canceled = StickyInteraction.cancelManipulation(moved);

  expect(canceled.workingDocument).toBe(documentWithTwoStickies);
  expect(canceled.session).toEqual({ status: "selected", stickyId: draggedId });
  expect(StickyInteraction.hasUndo(canceled)).toBe(false);
});

test.each<
  readonly [
    StickyResizeCorner,
    Readonly<{ x: number; y: number }>,
    Readonly<{ width: number; height: number }>,
  ]
>([
  [
    STICKY_RESIZE_CORNERS.northWest,
    { x: 30, y: 30 },
    { width: 140, height: 90 },
  ],
  [
    STICKY_RESIZE_CORNERS.northEast,
    { x: 10, y: 30 },
    { width: 180, height: 90 },
  ],
  [
    STICKY_RESIZE_CORNERS.southEast,
    { x: 10, y: 20 },
    { width: 180, height: 110 },
  ],
  [
    STICKY_RESIZE_CORNERS.southWest,
    { x: 30, y: 20 },
    { width: 140, height: 110 },
  ],
])("%s のリサイズは反対側の二辺を固定する", (corner, position, size) => {
  const selected = StickyInteraction.select(
    StickyInteraction.create(documentWithTwoStickies),
    draggedId,
  );
  const resizing = StickyInteraction.beginResize(selected, corner, {
    x: 0,
    y: 0,
  });
  const moved = StickyInteraction.movePointer(resizing, { x: 20, y: 10 });
  const sticky = stickyIn(moved.workingDocument, draggedId);

  expect(sticky.position).toEqual(position);
  expect(sticky.size).toEqual(size);
});

test("北西ハンドルを大きく縮めても60 × 40より小さくならない", () => {
  const selected = StickyInteraction.select(
    StickyInteraction.create(documentWithTwoStickies),
    draggedId,
  );
  const resizing = StickyInteraction.beginResize(
    selected,
    STICKY_RESIZE_CORNERS.northWest,
    { x: 0, y: 0 },
  );
  const moved = StickyInteraction.movePointer(resizing, { x: 300, y: 300 });
  const sticky = stickyIn(moved.workingDocument, draggedId);

  expect(sticky.position).toEqual({ x: 110, y: 80 });
  expect(sticky.size).toEqual({ width: 60, height: 40 });
});

test("連続リサイズを確定するとundo 1回で開始前の矩形へ戻る", () => {
  const selected = StickyInteraction.select(
    StickyInteraction.create(documentWithTwoStickies),
    draggedId,
  );
  const resizing = StickyInteraction.beginResize(
    selected,
    STICKY_RESIZE_CORNERS.southEast,
    { x: 0, y: 0 },
  );
  const moved = StickyInteraction.movePointer(
    StickyInteraction.movePointer(resizing, { x: 10, y: 10 }),
    { x: 30, y: 20 },
  );
  const committed = StickyInteraction.commitManipulation(moved);
  const undone = StickyInteraction.undo(committed);

  expect(stickyIn(committed.workingDocument, draggedId).size).toEqual({
    width: 190,
    height: 120,
  });
  expect(stickyIn(undone.workingDocument, draggedId)).toEqual(draggedSticky);
  expect(StickyInteraction.hasUndo(undone)).toBe(false);
});

test("リサイズを取り消すと開始前の矩形へ戻して履歴へ積まない", () => {
  const selected = StickyInteraction.select(
    StickyInteraction.create(documentWithTwoStickies),
    draggedId,
  );
  const resizing = StickyInteraction.beginResize(
    selected,
    STICKY_RESIZE_CORNERS.southEast,
    { x: 0, y: 0 },
  );
  const moved = StickyInteraction.movePointer(resizing, { x: 30, y: 20 });
  const canceled = StickyInteraction.cancelManipulation(moved);

  expect(canceled.workingDocument).toBe(documentWithTwoStickies);
  expect(stickyIn(canceled.workingDocument, draggedId)).toEqual(draggedSticky);
  expect(canceled.session).toEqual({ status: "selected", stickyId: draggedId });
  expect(StickyInteraction.hasUndo(canceled)).toBe(false);
});
