import { expect, test } from "vitest";
import {
  Document,
  History,
  Sticky,
  StickyId,
  STICKY_TYPES,
} from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../../sticky-appearance";
import { StickyInteraction } from "../index";

const existingId = StickyId.create("stk_existing000");

const existingSticky = Sticky.create(
  existingId,
  STICKY_TYPES.event,
  "注文が確定した",
  { x: 10, y: 20 },
  { width: 160, height: 100 },
);

const documentWithSticky = {
  ...Document.empty(),
  stickies: [existingSticky],
};

/**
 * 文書の最後の付箋を返す。無ければ既存の付箋。
 *
 * @param document 対象の文書。
 * @returns 末尾の付箋。
 */
const lastSticky = (document: Document): Sticky => {
  const sticky = document.stickies[document.stickies.length - 1];
  return sticky ?? existingSticky;
};

test("パレットで選んだ種別の空白をクリックすると標準サイズの付箋を作成し本文編集を始める", () => {
  const selected = StickyInteraction.selectType(
    StickyInteraction.create(),
    STICKY_TYPES.actor,
  );
  const created = StickyInteraction.clickAt(selected, { x: 80, y: 90 });
  const sticky = lastSticky(created.workingDocument);
  const appearance = StickyAppearance.of(STICKY_TYPES.actor);

  expect(created.workingDocument.stickies).toHaveLength(1);
  expect(sticky.type).toBe(STICKY_TYPES.actor);
  expect(sticky.text).toBe("");
  expect(sticky.position).toEqual({ x: 80, y: 90 });
  expect(sticky.size).toEqual(appearance.defaultSize);
  expect(created.session).toEqual({
    status: "editing",
    stickyId: sticky.id,
    draftText: "",
    originalText: "",
  });
});

test("既存の付箋をクリックするとその付箋を選択する", () => {
  const selected = StickyInteraction.clickAt(
    StickyInteraction.create(documentWithSticky),
    { x: 10, y: 20 },
  );

  expect(selected.workingDocument.stickies).toHaveLength(1);
  expect(selected.session).toEqual({
    status: "selected",
    stickyId: existingId,
  });
});

test("選択中に Enter を押すと本文編集を始める", () => {
  const selected = StickyInteraction.clickAt(
    StickyInteraction.create(documentWithSticky),
    { x: 50, y: 40 },
  );
  const editing = StickyInteraction.pressEnter(selected);

  expect(editing.session).toEqual({
    status: "editing",
    stickyId: existingId,
    draftText: "注文が確定した",
    originalText: "注文が確定した",
  });
});

test("付箋をダブルクリックすると本文編集を始める", () => {
  const editing = StickyInteraction.doubleClickAt(
    StickyInteraction.create(documentWithSticky),
    { x: 50, y: 40 },
  );

  expect(editing.session).toEqual({
    status: "editing",
    stickyId: existingId,
    draftText: "注文が確定した",
    originalText: "注文が確定した",
  });
});

test("編集中に本文を変えて確定すると undo 1回で編集前の本文に戻る", () => {
  const editing = StickyInteraction.pressEnter(
    StickyInteraction.clickAt(
      StickyInteraction.create(documentWithSticky),
      { x: 50, y: 40 },
    ),
  );
  const typed = StickyInteraction.changeDraft(
    StickyInteraction.changeDraft(editing, "注文が"),
    "注文がキャンセルされた",
  );
  const committed = StickyInteraction.commitEdit(typed);
  const undone = StickyInteraction.undo(committed);

  expect(committed.workingDocument.stickies[0]?.text).toBe(
    "注文がキャンセルされた",
  );
  expect(committed.session).toEqual({
    status: "selected",
    stickyId: existingId,
  });
  expect(undone.workingDocument.stickies[0]?.text).toBe("注文が確定した");
});

test("編集中に Esc を押すと本文を確定して選択中になる", () => {
  const editing = StickyInteraction.changeDraft(
    StickyInteraction.pressEnter(
      StickyInteraction.clickAt(
        StickyInteraction.create(documentWithSticky),
        { x: 50, y: 40 },
      ),
    ),
    "更新後",
  );
  const afterEscape = StickyInteraction.pressEscape(editing);

  expect(afterEscape.workingDocument.stickies[0]?.text).toBe("更新後");
  expect(afterEscape.session).toEqual({
    status: "selected",
    stickyId: existingId,
  });
});

test("選択中に Esc を押すと選択を解除する", () => {
  const selected = StickyInteraction.clickAt(
    StickyInteraction.create(documentWithSticky),
    { x: 50, y: 40 },
  );
  const cleared = StickyInteraction.pressEscape(selected);

  expect(cleared.session).toEqual({ status: "idle" });
});

test("本文が変わっていなければ確定しても履歴は増えない", () => {
  const editing = StickyInteraction.pressEnter(
    StickyInteraction.clickAt(
      StickyInteraction.create(documentWithSticky),
      { x: 50, y: 40 },
    ),
  );
  const committed = StickyInteraction.commitEdit(editing);

  expect(History.undo(committed.history).some).toBe(false);
  expect(committed.workingDocument.stickies[0]?.text).toBe("注文が確定した");
});

test("作成して undo すると付箋が消える", () => {
  const created = StickyInteraction.clickAt(StickyInteraction.create(), {
    x: 0,
    y: 0,
  });
  const undone = StickyInteraction.undo(created);

  expect(created.workingDocument.stickies).toHaveLength(1);
  expect(undone.workingDocument.stickies).toHaveLength(0);
  expect(undone.session).toEqual({ status: "idle" });
});
