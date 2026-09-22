import { expect, test } from "vitest";
import { Connection, ConnectionId } from "../../connection";
import { Document as DocumentValue } from "../../document";
import {
  AddConnectionCommand,
  ChangeTitleCommand,
  History,
  RemoveConnectionCommand,
  ReplaceDocumentCommand,
} from "..";
import { Sticky, StickyId } from "../../sticky";

test("接続追加コマンドは実行→undo→redoで同じ文書へ戻る", () => {
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
  const redone = undone.some ? History.redo(undone.value) : undone;

  expect(executed.current.connections).toEqual([connection]);
  expect(undone.some && undone.value.current.connections).toEqual([]);
  expect(redone.some && redone.value.current).toEqual(executed.current);
});

test("タイトル変更コマンドは実行→undo→redoで同じ文書へ戻る", () => {
  const initial = DocumentValue.empty("初期");
  const executed = History.execute(
    History.create(initial),
    ChangeTitleCommand.create({ previous: "初期", next: "編集後" }),
  );

  const undone = History.undo(executed);
  const redone = undone.some ? History.redo(undone.value) : undone;

  expect(executed.current.title).toBe("編集後");
  expect(undone.some && undone.value.current).toEqual(initial);
  expect(redone.some && redone.value.current).toEqual(executed.current);
});

test("接続削除コマンドは実行→undo→redoで同じ文書へ戻る", () => {
  const fromId = StickyId.create("stk_from");
  const toId = StickyId.create("stk_to");
  const connection = Connection.create(
    ConnectionId.create("con_1"),
    fromId,
    toId,
    "",
    "",
  );
  const initial = {
    ...DocumentValue.empty(),
    connections: [connection],
  };
  const executed = History.execute(
    History.create(initial),
    RemoveConnectionCommand.create(connection),
  );

  const undone = History.undo(executed);
  const redone = undone.some ? History.redo(undone.value) : undone;

  expect(executed.current.connections).toEqual([]);
  expect(undone.some && undone.value.current).toEqual(initial);
  expect(redone.some && redone.value.current).toEqual(executed.current);
});

test("文書置換コマンドは実行→undo→redoで同じ文書へ戻る", () => {
  const previous = DocumentValue.empty("変更前");
  const next = { ...previous, title: "変更後" };
  const executed = History.execute(
    History.create(previous),
    ReplaceDocumentCommand.create({ previous, next }),
  );

  const undone = History.undo(executed);
  const redone = undone.some ? History.redo(undone.value) : undone;

  expect(executed.current).toEqual(next);
  expect(undone.some && undone.value.current).toEqual(previous);
  expect(redone.some && redone.value.current).toEqual(executed.current);
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
  expect(undone.some).toBe(true);

  const branched = History.execute(
    (undone as { some: true; value: History }).value,
    ChangeTitleCommand.create({ previous: "初期", next: "別の編集" }),
  );

  expect(History.redo(branched)).toEqual({ some: false });
});

test("履歴がない場合は取り消しも再実行もできない", () => {
  const history = History.create(DocumentValue.empty());

  expect(History.undo(history)).toEqual({ some: false });
  expect(History.redo(history)).toEqual({ some: false });
});
