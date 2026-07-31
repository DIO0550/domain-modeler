import { expect, test } from "vitest";
import { Connection, ConnectionId } from "./connection";
import { Document as DocumentValue } from "./document";
import { AddConnectionCommand, ChangeTitleCommand, History } from "./history";
import { Sticky, StickyId } from "./sticky";

test("接続追加コマンドを実行するとundoで接続を削除する", () => {
  const fromId = StickyId.create("stk_from");
  const toId = StickyId.create("stk_to");
  const initial = {
    ...DocumentValue.empty(),
    stickies: [
      Sticky.create(
        fromId,
        "actor",
        "from",
        { x: 0, y: 0 },
        { width: 1, height: 1 },
      ),
      Sticky.create(
        toId,
        "command",
        "to",
        { x: 2, y: 0 },
        { width: 1, height: 1 },
      ),
    ],
  };
  const connection = Connection.create(
    ConnectionId.create("con_1"),
    fromId,
    toId,
    "",
    "",
  );
  const executed = History.execute(
    History.create(initial),
    AddConnectionCommand.create(connection),
  );

  const undone = History.undo(executed);

  expect(executed.current.connections).toEqual([connection]);
  expect(undone.some && undone.value.current.connections).toEqual([]);
});

test("文書コマンドを実行するとコマンド実行前の文書へ戻せる", () => {
  const initial = DocumentValue.empty("初期");
  const history = History.execute(
    History.create(initial),
    ChangeTitleCommand.create({ previous: "初期", next: "編集後" }),
  );

  const result = History.undo(history);

  expect(history.current.title).toBe("編集後");
  expect(result.some && result.value.current).toEqual(initial);
});

test("文書コマンドを取り消した後は同じコマンドを再実行できる", () => {
  const initial = DocumentValue.empty("初期");
  const executed = History.execute(
    History.create(initial),
    ChangeTitleCommand.create({ previous: "初期", next: "編集後" }),
  );
  const undone = History.undo(executed);

  const redone = undone.some ? History.redo(undone.value) : undone;

  expect(redone.some && redone.value.current.title).toBe("編集後");
});

test("複数の文書コマンドは新しいものから順に取り消せる", () => {
  const initial = DocumentValue.empty("初期");
  const history = History.execute(
    History.execute(
      History.create(initial),
      ChangeTitleCommand.create({ previous: "初期", next: "編集1" }),
    ),
    ChangeTitleCommand.create({ previous: "編集1", next: "編集2" }),
  );
  const firstUndo = History.undo(history);
  const secondUndo = firstUndo.some ? History.undo(firstUndo.value) : firstUndo;

  expect(firstUndo.some && firstUndo.value.current.title).toBe("編集1");
  expect(secondUndo.some && secondUndo.value.current).toEqual(initial);
});

test("操作を取り消した後に別の操作を実行すると取り消す前の操作は再実行できない", () => {
  const initial = DocumentValue.empty("初期");
  const executed = History.execute(
    History.create(initial),
    ChangeTitleCommand.create({ previous: "初期", next: "編集後" }),
  );
  const undone = History.undo(executed);
  if (!undone.some) {
    expect.fail("文書コマンドを取り消せる必要がある");
  }

  const branched = History.execute(
    undone.value,
    ChangeTitleCommand.create({ previous: "初期", next: "別の編集" }),
  );

  expect(History.redo(branched)).toEqual({ some: false });
});

test("履歴がない場合は取り消しも再実行もできない", () => {
  const history = History.create(DocumentValue.empty());

  expect(History.undo(history)).toEqual({ some: false });
  expect(History.redo(history)).toEqual({ some: false });
});

test("履歴が100件を超えると最も古いコマンドから破棄する", () => {
  const initial = DocumentValue.empty("0");
  const history = Array.from({ length: 101 }, (_, index) => index + 1).reduce(
    (current, index) =>
      History.execute(
        current,
        ChangeTitleCommand.create({
          previous: String(index - 1),
          next: String(index),
        }),
      ),
    History.create(initial),
  );

  expect(history.undoStack).toHaveLength(100);
  expect(history.current.title).toBe("101");
});
