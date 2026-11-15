import { ConnectionId } from "@domain-modeler/canvas-core";
import { expect, test } from "vitest";
import { ConnectionInteraction } from "..";
import { setupConnectionCanvas } from "./connectionInteraction.test-support";

test.each([
  ConnectionInteraction.select,
  ConnectionInteraction.edit,
])("存在しない接続を選択・編集しようとしても文書と選択を変更しない (%#)", (select) => {
  const { initial } = setupConnectionCanvas();

  expect(select(initial, ConnectionId.create("con_missing00000"))).toEqual(
    initial,
  );
});

test("接続作成中の付箋クリックでは配置せず始点を選択する", () => {
  const { initial, source } = setupConnectionCanvas();
  const creating = ConnectionInteraction.toggleMode(initial);
  const selected = ConnectionInteraction.selectAt(creating, { x: 50, y: 50 });

  expect(selected.session).toEqual({
    status: "selectingTarget",
    sourceId: source.id,
  });
  expect(selected.board.workingDocument).toEqual(initial.board.workingDocument);
});

test("接続作成モードをもう一度選ぶと文書を変えずに作成を終了する", () => {
  const { initial } = setupConnectionCanvas();
  const cancelled = ConnectionInteraction.toggleMode(
    ConnectionInteraction.toggleMode(initial),
  );

  expect(cancelled.session).toEqual({ status: "idle" });
  expect(cancelled.board.history).toEqual(initial.board.history);
});

test("選択していない付箋のハンドルでは接続を開始しない", () => {
  const { initial, source } = setupConnectionCanvas();
  const started = ConnectionInteraction.beginConnectionDrag(initial, {
    stickyId: source.id,
    anchor: "right",
  });

  expect(started).toEqual(initial);
});

test("別の付箋を選択している場合も接続を開始しない", () => {
  const { initial, target } = setupConnectionCanvas();
  const selected = ConnectionInteraction.selectAt(initial, { x: 50, y: 50 });

  expect(
    ConnectionInteraction.beginConnectionDrag(selected, {
      stickyId: target.id,
      anchor: "left",
    }),
  ).toEqual(selected);
});

test("接続を選択してEnterを押すと現在のラベルを編集できる", () => {
  const { initial, connection } = setupConnectionCanvas();
  const editing = ConnectionInteraction.pressEnter(
    ConnectionInteraction.select(initial, connection.id),
  );

  expect(editing.session).toMatchObject({
    status: "editing",
    connectionId: connection.id,
    draftLabel: "確定後",
  });
  expect(editing.board.history).toEqual(initial.board.history);
});

test("ラベルを変えずに編集を終了しても履歴は増えない", () => {
  const { initial, connection } = setupConnectionCanvas();
  const committed = ConnectionInteraction.commitEdit(
    ConnectionInteraction.edit(initial, connection.id),
  );

  expect(committed.session).toEqual({
    status: "selected",
    connectionId: connection.id,
  });
  expect(committed.board.history).toEqual(initial.board.history);
});

test("接続ラベルの編集中にEscapeを押すと下書きを1操作として確定する", () => {
  const { initial, connection } = setupConnectionCanvas();
  const drafted = ConnectionInteraction.changeDraft(
    ConnectionInteraction.edit(initial, connection.id),
    "支払い後",
  );
  const committed = ConnectionInteraction.pressEscape(drafted);

  expect(committed.board.workingDocument.connections[0]?.label).toBe(
    "支払い後",
  );
  expect(committed.session).toEqual({
    status: "selected",
    connectionId: connection.id,
  });
  expect(ConnectionInteraction.undo(committed).board.workingDocument).toEqual(
    initial.board.workingDocument,
  );
});

test("接続作成中のEnterとDeleteは文書や始点を変更しない", () => {
  const { initial, source } = setupConnectionCanvas();
  const creating = ConnectionInteraction.selectEndpoint(
    ConnectionInteraction.toggleMode(initial),
    source.id,
  );
  const afterKeys = ConnectionInteraction.pressDelete(
    ConnectionInteraction.pressEnter(creating),
  );

  expect(afterKeys).toEqual(creating);
});

test("ラベル編集中のDeleteでは接続を削除しない", () => {
  const { initial, connection } = setupConnectionCanvas();
  const editing = ConnectionInteraction.edit(initial, connection.id);

  expect(ConnectionInteraction.pressDelete(editing)).toEqual(editing);
});

test("ラベルを入力していないときは下書き変更を受け付けない", () => {
  const { initial } = setupConnectionCanvas();

  expect(ConnectionInteraction.changeDraft(initial, "変更しない")).toEqual(
    initial,
  );
});

test("接続が選択されているだけなら終了保存用の下書きは存在しない", () => {
  const { initial, connection } = setupConnectionCanvas();
  const selected = ConnectionInteraction.select(initial, connection.id);

  expect(ConnectionInteraction.draftHistory(selected)).toEqual({ some: false });
});

test("接続の編集中にundoすると下書きの変更だけを取り消す", () => {
  const { initial, connection } = setupConnectionCanvas();
  const drafted = ConnectionInteraction.changeDraft(
    ConnectionInteraction.edit(initial, connection.id),
    "支払い後",
  );
  const undone = ConnectionInteraction.undo(drafted);

  expect(undone.board.workingDocument).toEqual(initial.board.workingDocument);
  expect(
    ConnectionInteraction.redo(undone).board.workingDocument.connections[0]
      ?.label,
  ).toBe("支払い後");
});
