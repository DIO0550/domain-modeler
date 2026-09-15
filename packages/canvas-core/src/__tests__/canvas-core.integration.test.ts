import { expect, test } from "vitest";
import {
  AddConnectionCommand,
  Document,
  ExternalChanges,
  History,
  Option,
  ReplaceDocumentCommand,
  Result,
  Serialize,
} from "..";

/** 作成・編集・接続を済ませた代表キャンバスを用意する。 */
const setup = () => {
  const empty = Document.empty("注文ドメイン");
  const commandAdded = Result.unwrap(
    Document.addSticky(
      empty,
      "command",
      "注文する",
      { x: 20, y: 40 },
      { width: 160, height: 100 },
    ),
  );
  const eventAdded = Result.unwrap(
    Document.addSticky(
      commandAdded,
      "event",
      "注文された",
      { x: 320, y: 40 },
      { width: 180, height: 120 },
    ),
  );
  const command = eventAdded.stickies[0];
  const event = eventAdded.stickies[1];
  const edited = Document.changeStickyType(eventAdded, command.id, "policy");
  const connected = Result.unwrap(
    Document.addConnection(edited, command.id, event.id, "確定後"),
  );
  const anchored = Document.updateConnectionAnchors(
    connected,
    connected.connections[0].id,
    "right",
    "left",
  );
  return { empty, edited, connected: anchored };
};

test("作成・編集・接続したキャンバスは保存と再読込を経ても構造を維持する", () => {
  const { empty, edited, connected } = setup();
  const history = History.execute(
    History.create(edited),
    AddConnectionCommand.create(connected.connections[0]),
  );
  const json = Serialize.stringify(history.current);
  const restored = Result.unwrap(Serialize.parse(json));

  expect(restored).toEqual(connected);
  expect(JSON.parse(json)).toMatchObject({
    connections: [{ note: "注文する -> 注文された" }],
  });
  expect(empty).toEqual(Document.empty("注文ドメイン"));
  expect(edited.connections).toEqual([]);
  expect(restored.stickies.map((sticky) => sticky.type)).toEqual([
    "policy",
    "event",
  ]);
  expect(restored.connections[0]).toMatchObject({
    fromAnchor: "right",
    toAnchor: "left",
    label: "確定後",
    note: "",
  });
});

test("保存後の接続追加をundoすると接続だけが消えredoで保存内容に戻る", () => {
  const { edited, connected } = setup();
  const history = History.execute(
    History.create(edited),
    AddConnectionCommand.create(connected.connections[0]),
  );
  const saved = Result.unwrap(
    Serialize.parse(Serialize.stringify(history.current)),
  );
  const undone = Option.unwrap(History.undo({ ...history, current: saved }));
  const redone = Option.unwrap(History.redo(undone));

  expect(undone.current).toEqual(edited);
  expect(redone.current).toEqual(saved);
  expect(History.redo(redone)).toEqual(Option.none());
});

test("付箋削除で消えた接続もundoと保存の往復で元の順序に復元する", () => {
  const { connected } = setup();
  const removed = Document.removeSticky(connected, connected.stickies[0].id);
  const history = History.execute(
    History.create(connected),
    ReplaceDocumentCommand.create({ previous: connected, next: removed }),
  );
  const undone = Option.unwrap(History.undo(history));

  expect(removed.stickies).toEqual([connected.stickies[1]]);
  expect(removed.connections).toEqual([]);
  expect(
    Result.unwrap(Serialize.parse(Serialize.stringify(undone.current))),
  ).toEqual(connected);
  expect(Option.unwrap(History.redo(undone)).current).toEqual(removed);
});

test("外部の保存済みキャンバスを取り込んだ変更は一度のundoで取り込み前へ戻る", () => {
  const { edited, connected } = setup();
  const history = Result.unwrap(
    ExternalChanges.apply(
      History.create(edited),
      Serialize.stringify(connected),
    ),
  );
  const undone = Option.unwrap(History.undo(history));

  expect(history.current).toEqual(connected);
  expect(undone.current).toEqual(edited);
  expect(History.undo(undone)).toEqual(Option.none());
  expect(Option.unwrap(History.redo(undone)).current).toEqual(connected);
});
