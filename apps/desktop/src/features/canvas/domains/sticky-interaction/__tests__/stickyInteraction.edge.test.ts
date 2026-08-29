import { expect, test } from "vitest";
import {
  Document,
  Sticky,
  StickyId,
  STICKY_TYPES,
} from "@domain-modeler/canvas-core";
import { StickyInteraction } from "../index";

const existingId = StickyId.create("stk_existing000");

const documentWithSticky = {
  ...Document.empty(),
  stickies: [
    Sticky.create(
      existingId,
      STICKY_TYPES.event,
      "注文が確定した",
      { x: 10, y: 20 },
      { width: 160, height: 100 },
    ),
  ],
};

test("存在しない付箋IDを選択しても状態は変わらない", () => {
  const idle = StickyInteraction.create(documentWithSticky);

  expect(
    StickyInteraction.select(idle, StickyId.create("stk_missing0000")),
  ).toEqual(idle);
});

test("編集中に別の付箋を選択すると本文を確定してから選択する", () => {
  const otherId = StickyId.create("stk_other000000");
  const documentWithTwoStickies = {
    ...Document.empty(),
    stickies: [
      Sticky.create(
        existingId,
        STICKY_TYPES.event,
        "注文が確定した",
        { x: 10, y: 20 },
        { width: 160, height: 100 },
      ),
      Sticky.create(
        otherId,
        STICKY_TYPES.command,
        "注文を確定する",
        { x: 200, y: 20 },
        { width: 160, height: 100 },
      ),
    ],
  };
  const editing = StickyInteraction.changeDraft(
    StickyInteraction.pressEnter(
      StickyInteraction.clickAt(
        StickyInteraction.create(documentWithTwoStickies),
        { x: 50, y: 40 },
      ),
    ),
    "更新後",
  );
  const selected = StickyInteraction.select(editing, otherId);

  expect(selected.workingDocument.stickies[0]?.text).toBe("更新後");
  expect(selected.session).toEqual({
    status: "selected",
    stickyId: otherId,
  });
});

test("空白のダブルクリックでは付箋を増やさない", () => {
  const initial = StickyInteraction.create();
  const afterDoubleClick = StickyInteraction.doubleClickAt(initial, {
    x: 400,
    y: 400,
  });

  expect(afterDoubleClick.workingDocument.stickies).toHaveLength(0);
  expect(afterDoubleClick.session).toEqual({ status: "idle" });
});

test("編集していないときに確定しても状態は変わらない", () => {
  const selected = StickyInteraction.clickAt(
    StickyInteraction.create(documentWithSticky),
    { x: 50, y: 40 },
  );

  expect(StickyInteraction.commitEdit(selected)).toEqual(selected);
});

test("選択していないときに Enter を押しても編集は始まらない", () => {
  const idle = StickyInteraction.create(documentWithSticky);

  expect(StickyInteraction.pressEnter(idle)).toEqual(idle);
});

test("取り消す操作が無いときは undo しても文書は変わらない", () => {
  const initial = StickyInteraction.create(documentWithSticky);

  expect(StickyInteraction.undo(initial).workingDocument).toEqual(
    documentWithSticky,
  );
});

test("本文変更を undo したあと redo すると確定した本文に戻る", () => {
  const committed = StickyInteraction.commitEdit(
    StickyInteraction.changeDraft(
      StickyInteraction.pressEnter(
        StickyInteraction.clickAt(
          StickyInteraction.create(documentWithSticky),
          { x: 50, y: 40 },
        ),
      ),
      "注文がキャンセルされた",
    ),
  );
  const undone = StickyInteraction.undo(committed);
  const redone = StickyInteraction.redo(undone);

  expect(undone.workingDocument.stickies[0]?.text).toBe("注文が確定した");
  expect(redone.workingDocument.stickies[0]?.text).toBe(
    "注文がキャンセルされた",
  );
});

test("編集中に別の空白をクリックすると確定してから新しい付箋を作る", () => {
  const editing = StickyInteraction.changeDraft(
    StickyInteraction.pressEnter(
      StickyInteraction.clickAt(
        StickyInteraction.create(documentWithSticky),
        { x: 50, y: 40 },
      ),
    ),
    "更新後",
  );
  const created = StickyInteraction.clickAt(editing, { x: 400, y: 400 });

  expect(created.workingDocument.stickies).toHaveLength(2);
  expect(created.workingDocument.stickies[0]?.text).toBe("更新後");
  expect(created.session.status).toBe("editing");
  expect(created.session.status === "editing" && created.session.stickyId).not.toBe(
    existingId,
  );
});
