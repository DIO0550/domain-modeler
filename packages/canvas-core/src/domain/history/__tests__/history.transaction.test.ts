import { expect, test } from "vitest";
import { Document } from "../../document";
import { History } from "..";

test("ドラッグ相当の連続更新は確定後に一度だけ戻せる", () => {
  const initial = Document.empty("初期");
  const mid = { ...initial, title: "編集中" };
  const committed = { ...initial, title: "確定" };

  const history = History.commit(
    History.replace(History.replace(History.begin(History.create(initial)), mid), committed),
  );
  const undone = History.undo(history);

  expect(history.current).toEqual(committed);
  expect(history.undoStack).toHaveLength(1);
  expect(undone.some && undone.value.current).toEqual(initial);
});

test("連続操作を確定するとやり直し候補は消える", () => {
  const initial = Document.empty("初期");
  const edited = { ...initial, title: "編集後" };
  const undone = History.undo(History.record(History.create(initial), edited));
  expect(undone.some).toBe(true);

  const idle = (
    undone as { some: true; value: ReturnType<typeof History.create> }
  ).value;
  const branched = History.commit(
    History.replace(
      History.begin(idle),
      { ...initial, title: "別の編集" },
    ),
  );

  expect(History.redo(branched)).toEqual({ some: false });
});

test("連続操作の開始後は確定するまで履歴へ積まない", () => {
  const initial = Document.empty("初期");
  const mid = { ...initial, title: "編集中" };

  const inProgress = History.replace(History.begin(History.create(initial)), mid);

  expect(inProgress.status).toBe("transaction");
  expect(inProgress.current).toEqual(mid);
  expect(inProgress.undoStack).toHaveLength(0);
});
