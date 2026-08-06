import { expect, test } from "vitest";
import { Document as DocumentValue } from "../../document";
import { ChangeTitleCommand, History } from "..";

test("createはidle状態の空履歴を返す", () => {
  const history = History.create(DocumentValue.empty("初期"));

  expect(history.status).toBe("idle");
  expect(history.current.title).toBe("初期");
  expect(history.undoStack).toEqual([]);
  expect(history.redoStack).toEqual([]);
});

test("beginするとtransaction状態になりスタックは変わらない", () => {
  const idle = History.execute(
    History.create(DocumentValue.empty("初期")),
    ChangeTitleCommand.create({ previous: "初期", next: "編集後" }),
  );

  const tx = History.begin(idle);

  expect(tx.status).toBe("transaction");
  expect(tx.current).toEqual(idle.current);
  expect(tx.undoStack).toEqual(idle.undoStack);
  expect(tx.redoStack).toEqual(idle.redoStack);
});

test("replaceはcurrentのみ更新しundoStackに積まない", () => {
  const initial = DocumentValue.empty("初期");
  const mid = { ...initial, title: "編集中" };
  const tx = History.replace(History.begin(History.create(initial)), mid);

  expect(tx.status).toBe("transaction");
  expect(tx.current).toEqual(mid);
  expect(tx.undoStack).toHaveLength(0);
});

test("複数回replaceしてもスタックには積まない", () => {
  const initial = DocumentValue.empty("初期");
  const mid = { ...initial, title: "編集中" };
  const next = { ...initial, title: "確定前" };
  const tx = History.replace(
    History.replace(History.begin(History.create(initial)), mid),
    next,
  );

  expect(tx.current).toEqual(next);
  expect(tx.undoStack).toHaveLength(0);
});

test("commitすると1コマンド分だけundoStackに積まれidleに戻る", () => {
  const initial = DocumentValue.empty("初期");
  const committed = { ...initial, title: "確定" };
  const command = ChangeTitleCommand.create({
    previous: "初期",
    next: "確定",
  });
  const history = History.commit(
    History.replace(History.begin(History.create(initial)), committed),
    command,
  );

  expect(history.status).toBe("idle");
  expect(history.current).toEqual(committed);
  expect(history.undoStack).toHaveLength(1);
  expect(history.redoStack).toEqual([]);
});

test("commit後のundoでbegin時点の文書へ戻り中間状態には戻らない", () => {
  const initial = DocumentValue.empty("初期");
  const mid = { ...initial, title: "編集中" };
  const committed = { ...initial, title: "確定" };
  const history = History.commit(
    History.replace(
      History.replace(History.begin(History.create(initial)), mid),
      committed,
    ),
    ChangeTitleCommand.create({ previous: "初期", next: "確定" }),
  );

  const undone = History.undo(history);

  expect(undone.some && undone.value.current).toEqual(initial);
  expect(undone.some && undone.value.current.title).not.toBe("編集中");
});

test("undo後にcommitするとredoは破棄される", () => {
  const initial = DocumentValue.empty("初期");
  const undone = History.undo(
    History.execute(
      History.create(initial),
      ChangeTitleCommand.create({ previous: "初期", next: "編集後" }),
    ),
  );
  expect(undone.some).toBe(true);

  const idle = (
    undone as { some: true; value: ReturnType<typeof History.create> }
  ).value;
  const branched = History.commit(
    History.replace(History.begin(idle), { ...initial, title: "別の編集" }),
    ChangeTitleCommand.create({ previous: "初期", next: "別の編集" }),
  );

  expect(History.redo(branched)).toEqual({ some: false });
  expect(branched.current.title).toBe("別の編集");
});
