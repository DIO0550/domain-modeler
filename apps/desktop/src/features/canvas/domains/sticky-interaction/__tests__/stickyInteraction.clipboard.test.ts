import { Document, Sticky, StickyId } from "@domain-modeler/canvas-core";
import { expect, test } from "vitest";
import { StickyInteraction } from "..";

test("コピーした付箋は本文・種別・サイズを保ち、新しいIDで右下に貼り付ける", () => {
  const sticky = Sticky.create(
    StickyId.create("stk_original0000"),
    "command",
    "注文する",
    { x: -20, y: 30 },
    { width: 200, height: 120 },
  );
  const initial = StickyInteraction.create({
    ...Document.empty(),
    stickies: [sticky],
  });
  const copied = StickyInteraction.copy(
    StickyInteraction.select(initial, sticky.id),
  );
  const pasted = StickyInteraction.paste(copied);
  const added = pasted.workingDocument.stickies[1];

  expect(copied.workingDocument).toEqual(initial.workingDocument);
  expect(added).toMatchObject({
    ...sticky,
    id: expect.any(String),
    position: { x: 4, y: 54 },
  });
  expect(added?.id).not.toBe(sticky.id);
  expect(pasted.session).toEqual({ status: "selected", stickyId: added?.id });
  expect(StickyInteraction.undo(pasted).workingDocument).toEqual(
    initial.workingDocument,
  );
  expect(
    StickyInteraction.redo(StickyInteraction.undo(pasted)).workingDocument,
  ).toEqual(pasted.workingDocument);
});

test("連続して貼り付けるたびに直前の複製から右下へずらす", () => {
  const initial = StickyInteraction.commitEdit(
    StickyInteraction.clickAt(StickyInteraction.create(), { x: 10, y: 20 }),
  );
  const first = StickyInteraction.paste(StickyInteraction.copy(initial));
  const second = StickyInteraction.paste(first);

  expect(
    second.workingDocument.stickies.map((sticky) => sticky.position),
  ).toEqual([
    { x: 10, y: 20 },
    { x: 34, y: 44 },
    { x: 58, y: 68 },
  ]);
  expect(
    new Set(second.workingDocument.stickies.map((sticky) => sticky.id)).size,
  ).toBe(3);
});

test("コピー元を削除しても保存した内容を貼り付けられる", () => {
  const selected = StickyInteraction.commitEdit(
    StickyInteraction.changeDraft(
      StickyInteraction.clickAt(StickyInteraction.create(), { x: 10, y: 20 }),
      "注文された",
    ),
  );
  const copied = StickyInteraction.copy(selected);
  const deleted = StickyInteraction.pressDelete(copied);
  const pasted = StickyInteraction.paste(deleted);

  expect(deleted.workingDocument.stickies).toEqual([]);
  expect(pasted.workingDocument.stickies).toHaveLength(1);
  expect(pasted.workingDocument.stickies[0]).toMatchObject({
    text: "注文された",
    position: { x: 34, y: 44 },
  });
});

test("コピーしていない場合は貼り付けても文書と履歴を変えない", () => {
  const initial = StickyInteraction.create();

  expect(StickyInteraction.paste(initial)).toEqual(initial);
});

test("選択がないときはコピーしてもクリップボードを変更しない", () => {
  const initial = StickyInteraction.create();

  expect(StickyInteraction.copy(initial)).toEqual(initial);
});

test("本文編集中は付箋の貼り付けを受け付けない", () => {
  const selected = StickyInteraction.commitEdit(
    StickyInteraction.clickAt(StickyInteraction.create(), { x: 10, y: 20 }),
  );
  const editing = StickyInteraction.pressEnter(
    StickyInteraction.copy(selected),
  );

  expect(StickyInteraction.paste(editing)).toEqual(editing);
});
