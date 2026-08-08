import { expect, test } from "vitest";
import { Connection, ConnectionId } from "../../connection";
import { Document as DocumentValue } from "../../document";
import {
  AddConnectionCommand,
  ChangeTitleCommand,
  History,
  RemoveConnectionCommand,
} from "..";
import { Sticky, StickyId } from "../../sticky";

test("文書コマンドのundo後も別途変更したviewportは巻き戻らない", () => {
  const initial = DocumentValue.empty("初期");
  const executed = History.execute(
    History.create(initial),
    ChangeTitleCommand.create({ previous: "初期", next: "編集後" }),
  );
  const panned = {
    ...executed,
    current: {
      ...executed.current,
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

test("現行DocumentCommandの実行・undoはviewportを変更しない", () => {
  const fromId = StickyId.create("stk_from");
  const toId = StickyId.create("stk_to");
  const viewport = { x: 10, y: 20, zoom: 2 };
  const initial = {
    ...DocumentValue.empty("初期"),
    viewport,
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

  const added = History.execute(
    History.create(initial),
    AddConnectionCommand.create(connection),
  );
  const titled = History.execute(
    added,
    ChangeTitleCommand.create({ previous: "初期", next: "編集後" }),
  );
  const removed = History.execute(
    titled,
    RemoveConnectionCommand.create(connection),
  );
  const undone = History.undo(removed);

  expect(added.current.viewport).toEqual(viewport);
  expect(titled.current.viewport).toEqual(viewport);
  expect(removed.current.viewport).toEqual(viewport);
  expect(undone.some && undone.value.current.viewport).toEqual(viewport);
});

test("履歴は文書のみを対象とし選択状態を持たない", () => {
  const history = History.create(DocumentValue.empty("初期"));

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
