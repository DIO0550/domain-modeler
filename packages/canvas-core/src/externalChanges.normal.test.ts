import { expect, test } from "vitest";
import { Document } from "./domains/document";
import { History } from "./domains/history";
import { ChangeTitleCommand } from "./domains/history/document-command";
import { Result } from "./domains/result";
import { StickyId } from "./domains/sticky";
import { ConnectionId } from "./domains/connection";
import { ExternalChanges } from "./externalChanges";
import { Serialize } from "./serialize";

const emptyDocumentJson = (title: string): string =>
  JSON.stringify({
    version: "1.0",
    title,
    viewport: { x: 0, y: 0, zoom: 1 },
    stickies: [],
    connections: [],
  });

const documentWithStickiesJson = (): string =>
  JSON.stringify({
    version: "1.0",
    title: "外部編集後",
    viewport: { x: 40, y: 80, zoom: 2 },
    stickies: [
      {
        id: "stk_x7f3q9abcdef",
        type: "event",
        text: "注文が確定した",
        position: { x: 320, y: 180 },
        size: { width: 160, height: 100 },
      },
      {
        id: "stk_9k2m4pabcdef",
        type: "actor",
        text: "購入者",
        position: { x: 100, y: 180 },
        size: { width: 120, height: 80 },
      },
    ],
    connections: [
      {
        id: "con_a1b2c3abcdef",
        from: "stk_9k2m4pabcdef",
        to: "stk_x7f3q9abcdef",
        fromAnchor: "right",
        label: "確定後",
        note: "購入者 -> 注文が確定した",
      },
    ],
  });

test("妥当な空ドキュメント JSON を取り込むと current が置換される", () => {
  const history = History.create(Document.empty("初期"));
  const applied = Result.unwrap(
    ExternalChanges.apply(history, emptyDocumentJson("取り込み後")),
  );

  expect(applied.current).toEqual({
    version: "1.0",
    title: "取り込み後",
    viewport: { x: 0, y: 0, zoom: 1 },
    stickies: [],
    connections: [],
  });
});

test("付箋・接続を含む妥当 JSON を取り込むと Document 全体が一致する", () => {
  const history = History.create(Document.empty("初期"));
  const applied = Result.unwrap(
    ExternalChanges.apply(history, documentWithStickiesJson()),
  );

  expect(applied.current).toEqual({
    version: "1.0",
    title: "外部編集後",
    viewport: { x: 40, y: 80, zoom: 2 },
    stickies: [
      {
        id: StickyId.create("stk_x7f3q9abcdef"),
        type: "event",
        text: "注文が確定した",
        position: { x: 320, y: 180 },
        size: { width: 160, height: 100 },
      },
      {
        id: StickyId.create("stk_9k2m4pabcdef"),
        type: "actor",
        text: "購入者",
        position: { x: 100, y: 180 },
        size: { width: 120, height: 80 },
      },
    ],
    connections: [
      {
        id: ConnectionId.create("con_a1b2c3abcdef"),
        from: StickyId.create("stk_9k2m4pabcdef"),
        to: StickyId.create("stk_x7f3q9abcdef"),
        fromAnchor: "right",
        toAnchor: undefined,
        label: "確定後",
        note: "",
      },
    ],
  });
});

test("取り込み後の undo で取り込み前 Document に戻る", () => {
  const initial = Document.empty("初期");
  const history = History.create(initial);
  const applied = Result.unwrap(
    ExternalChanges.apply(history, emptyDocumentJson("取り込み後")),
  );

  const undone = History.undo(applied);

  expect(undone.some && undone.value.current).toEqual(initial);
});

test("undo 後の redo で取り込み後 Document に戻る", () => {
  const history = History.create(Document.empty("初期"));
  const applied = Result.unwrap(
    ExternalChanges.apply(history, emptyDocumentJson("取り込み後")),
  );
  const undone = History.undo(applied);
  const redone = undone.some ? History.redo(undone.value) : undone;

  expect(redone.some && redone.value.current.title).toBe("取り込み後");
});

test("取り込み成功時に redo スタックが破棄される", () => {
  const initial = Document.empty("初期");
  const edited = History.execute(
    History.create(initial),
    ChangeTitleCommand.create({ previous: "初期", next: "編集後" }),
  );
  const undone = History.undo(edited);
  expect(undone.some).toBe(true);

  const applied = Result.unwrap(
    ExternalChanges.apply(
      (undone as { some: true; value: History }).value,
      emptyDocumentJson("外部取り込み"),
    ),
  );

  expect(applied.redoStack).toEqual([]);
  expect(History.redo(applied)).toEqual({ some: false });
});

test("同一内容の再取り込みでも履歴エントリが増える", () => {
  const document = Document.empty("同じ");
  const json = Serialize.stringify(document);
  const history = History.create(document);

  const first = Result.unwrap(ExternalChanges.apply(history, json));
  const second = Result.unwrap(ExternalChanges.apply(first, json));

  expect(first.undoStack).toHaveLength(1);
  expect(second.undoStack).toHaveLength(2);
  expect(second.current).toEqual(document);
});
