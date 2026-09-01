import { expect, test } from "vitest";
import { Connection, ConnectionId } from "../../../connection";
import { Document } from "../../../document";
import { StickyId } from "../../../sticky";
import {
  AddConnectionCommand,
  ChangeTitleCommand,
  DocumentCommand,
  RemoveConnectionCommand,
  ReplaceDocumentCommand,
} from "..";

const connection = Connection.create(
  ConnectionId.create("con_1"),
  StickyId.create("stk_from"),
  StickyId.create("stk_to"),
  "",
  "",
);

test("タイトル変更コマンドは文書タイトルを変更する", () => {
  const command = ChangeTitleCommand.create({
    previous: "変更前",
    next: "変更後",
  });

  expect(DocumentCommand.execute(command, Document.empty("変更前")).title).toBe(
    "変更後",
  );
  expect(DocumentCommand.inverse(command)).toEqual(
    ChangeTitleCommand.create({ previous: "変更後", next: "変更前" }),
  );
});

test("接続追加コマンドの逆操作は同じ接続を削除する", () => {
  const command = AddConnectionCommand.create(connection);
  const added = DocumentCommand.execute(command, Document.empty());

  expect(added.connections).toEqual([connection]);
  expect(DocumentCommand.inverse(command)).toEqual(
    RemoveConnectionCommand.create(connection),
  );
});

test("接続削除コマンドの逆操作は同じ接続を追加する", () => {
  const command = RemoveConnectionCommand.create(connection);
  const document = { ...Document.empty(), connections: [connection] };

  expect(DocumentCommand.execute(command, document).connections).toEqual([]);
  expect(DocumentCommand.inverse(command)).toEqual(
    AddConnectionCommand.create(connection),
  );
});

test("文書置換コマンドの逆操作は変更前後を入れ替える", () => {
  const previous = Document.empty("変更前");
  const next = Document.empty("変更後");
  const command = ReplaceDocumentCommand.create({ previous, next });

  expect(DocumentCommand.execute(command, previous)).toEqual(next);
  expect(DocumentCommand.inverse(command)).toEqual(
    ReplaceDocumentCommand.create({ previous: next, next: previous }),
  );
});
