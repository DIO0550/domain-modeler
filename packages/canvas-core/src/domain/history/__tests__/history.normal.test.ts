import { expect, test } from "vitest";
import { Document } from "../../document";
import { History } from "..";

test("確定した編集を記録すると直前の文書へ戻せる", () => {
  const initial = Document.empty("初期");
  const edited = { ...initial, title: "編集後" };

  const result = History.undo(History.record(History.create(initial), edited));

  expect(result.some && result.value.current).toEqual(initial);
});

test("文書を戻した後は編集後の文書へ進める", () => {
  const initial = Document.empty("初期");
  const edited = { ...initial, title: "編集後" };
  const undone = History.undo(History.record(History.create(initial), edited));

  const redone = undone.some ? History.redo(undone.value) : undone;

  expect(redone.some && redone.value.current).toEqual(edited);
});

test("複数の編集は新しいものから順に取り消せる", () => {
  const initial = Document.empty("初期");
  const first = { ...initial, title: "編集1" };
  const second = { ...initial, title: "編集2" };
  const history = History.record(
    History.record(History.create(initial), first),
    second,
  );
  const firstUndo = History.undo(history);
  const secondUndo = firstUndo.some ? History.undo(firstUndo.value) : firstUndo;

  expect(firstUndo.some && firstUndo.value.current).toEqual(first);
  expect(secondUndo.some && secondUndo.value.current).toEqual(initial);
});

test("戻した後に新しく編集すると戻す前の文書へは進めない", () => {
  const initial = Document.empty("初期");
  const edited = { ...initial, title: "編集後" };
  const undone = History.undo(History.record(History.create(initial), edited));
  expect(undone.some).toBe(true);

  const branched = History.record(
    (undone as { some: true; value: ReturnType<typeof History.create> }).value,
    { ...initial, title: "別の編集" },
  );

  expect(History.redo(branched)).toEqual({ some: false });
});

test("履歴がない場合は戻る文書も進む文書もない", () => {
  const history = History.create(Document.empty());

  expect(History.undo(history)).toEqual({ some: false });
  expect(History.redo(history)).toEqual({ some: false });
});

test("履歴が100件を超えると最も古い編集から破棄する", () => {
  const initial = Document.empty("0");
  const history = Array.from({ length: 101 }, (_, index) => index + 1).reduce(
    (current, index) =>
      History.record(current, { ...initial, title: String(index) }),
    History.create(initial),
  );

  expect(history.undoStack).toHaveLength(100);
  expect(history.undoStack[0]?.previous.title).toBe("1");
  expect(history.current.title).toBe("101");
});
