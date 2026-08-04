import { expect, test } from "vitest";
import { Document } from "../../document";
import { History } from "..";

test("文書を戻しても表示範囲は戻さない", () => {
  const initial = Document.empty("初期");
  const edited = { ...initial, title: "編集後" };
  const recorded = History.record(History.create(initial), edited);
  const panned = {
    ...recorded,
    current: {
      ...recorded.current,
      viewport: { x: 40, y: -20, zoom: 1.5 },
    },
  };

  const undone = History.undo(panned);

  expect(undone.some && undone.value.current.title).toBe("初期");
  expect(undone.some && undone.value.current.viewport).toEqual({
    x: 40,
    y: -20,
    zoom: 1.5,
  });
});

test("やり直しても表示範囲は維持する", () => {
  const initial = Document.empty("初期");
  const edited = { ...initial, title: "編集後" };
  const recorded = History.record(History.create(initial), edited);
  const panned = {
    ...recorded,
    current: {
      ...recorded.current,
      viewport: { x: 40, y: -20, zoom: 1.5 },
    },
  };
  const undone = History.undo(panned);
  expect(undone.some).toBe(true);

  const redone = History.redo(
    (undone as { some: true; value: ReturnType<typeof History.create> }).value,
  );

  expect(redone.some && redone.value.current.title).toBe("編集後");
  expect(redone.some && redone.value.current.viewport).toEqual({
    x: 40,
    y: -20,
    zoom: 1.5,
  });
});

test("履歴は文書のみを対象とし選択状態を持たない", () => {
  const history = History.create(Document.empty("初期"));

  expect(Object.keys(history.current).sort()).toEqual([
    "connections",
    "stickies",
    "title",
    "version",
    "viewport",
  ]);
  expect(history).not.toHaveProperty("selection");
  expect(history.current).not.toHaveProperty("selection");
  expect(history.current).not.toHaveProperty("selectedStickyIds");
});
