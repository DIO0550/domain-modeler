import { expect, test } from "vitest";
import {
  type Connection,
  ConnectionId,
  Document,
  Sticky,
  StickyId,
  STICKY_TYPES,
} from "@domain-modeler/canvas-core";
import { ConnectionInteraction } from "..";

const sourceId = StickyId.create("stk_source00000");
const targetId = StickyId.create("stk_target00000");
const connectionId = ConnectionId.create("con_existing000");

const source = Sticky.create(
  sourceId,
  STICKY_TYPES.actor,
  "購入者",
  { x: 20, y: 20 },
  { width: 120, height: 80 },
);
const target = Sticky.create(
  targetId,
  STICKY_TYPES.command,
  "注文する",
  { x: 240, y: 20 },
  { width: 160, height: 100 },
);
const connection: Connection = {
  id: connectionId,
  from: sourceId,
  to: targetId,
  label: "操作",
  note: "",
};
const documentWithStickies = {
  ...Document.empty(),
  stickies: [source, target],
};
const connectedDocument = {
  ...documentWithStickies,
  connections: [connection],
};

test("接続モードで始点と終点を選ぶと接続を作成して選択する", () => {
  const selectingSource = ConnectionInteraction.toggleMode(
    ConnectionInteraction.create(documentWithStickies),
  );
  const selectingTarget = ConnectionInteraction.selectEndpoint(
    selectingSource,
    sourceId,
  );
  const created = ConnectionInteraction.selectEndpoint(
    selectingTarget,
    targetId,
  );

  expect(created.board.workingDocument.connections).toHaveLength(1);
  expect(created.board.workingDocument.connections[0]).toMatchObject({
    from: sourceId,
    to: targetId,
    label: "",
  });
  expect(created.session).toEqual({
    status: "selected",
    connectionId: created.board.workingDocument.connections[0]?.id,
  });
});

test("同じ付箋を始点と終点に選んでも自己参照を作成せずcoreエラーを保持する", () => {
  const selectingSource = ConnectionInteraction.toggleMode(
    ConnectionInteraction.create(documentWithStickies),
  );
  const selectingTarget = ConnectionInteraction.selectEndpoint(
    selectingSource,
    sourceId,
  );
  const rejected = ConnectionInteraction.selectEndpoint(
    selectingTarget,
    sourceId,
  );

  expect(rejected.board.workingDocument.connections).toHaveLength(0);
  expect(rejected.session).toEqual({
    status: "selectingTarget",
    sourceId,
  });
  expect(rejected.error).toEqual({
    some: true,
    value: {
      code: "SELF_REFERENTIAL_CONNECTION",
      message: "A sticky cannot connect to itself",
    },
  });
});

test("自己参照エラー後に別の終点を選ぶと接続を作成してエラーを消す", () => {
  const selectingSource = ConnectionInteraction.toggleMode(
    ConnectionInteraction.create(documentWithStickies),
  );
  const selectingTarget = ConnectionInteraction.selectEndpoint(
    selectingSource,
    sourceId,
  );
  const rejected = ConnectionInteraction.selectEndpoint(
    selectingTarget,
    sourceId,
  );
  const created = ConnectionInteraction.selectEndpoint(rejected, targetId);

  expect(created.board.workingDocument.connections).toHaveLength(1);
  expect(created.error).toEqual({ some: false });
});

test("接続作成はundo 1回で取り消してredoできる", () => {
  const selectingSource = ConnectionInteraction.toggleMode(
    ConnectionInteraction.create(documentWithStickies),
  );
  const selectingTarget = ConnectionInteraction.selectEndpoint(
    selectingSource,
    sourceId,
  );
  const created = ConnectionInteraction.selectEndpoint(
    selectingTarget,
    targetId,
  );
  const undone = ConnectionInteraction.undo(created);
  const redone = ConnectionInteraction.redo(undone);

  expect(undone.board.workingDocument.connections).toHaveLength(0);
  expect(undone.session).toEqual({ status: "idle" });
  expect(redone.board.workingDocument.connections).toHaveLength(1);
});

test("始点に選んだ付箋がundoで消えたら接続作成を終了する", () => {
  const createdSticky = ConnectionInteraction.clickAt(
    ConnectionInteraction.create(),
    { x: 40, y: 60 },
  );
  const stickyId = createdSticky.board.workingDocument.stickies[0]?.id;
  if (stickyId === undefined) {
    throw new Error("付箋が作成されていません");
  }
  const selectingTarget = ConnectionInteraction.selectEndpoint(
    ConnectionInteraction.toggleMode(createdSticky),
    stickyId,
  );

  const undone = ConnectionInteraction.undo(selectingTarget);

  expect(undone.board.workingDocument.stickies).toHaveLength(0);
  expect(undone.session).toEqual({ status: "idle" });
  expect(undone.error).toEqual({ some: false });
});

test("ラベル編集は確定まで文書を変えず確定時に1操作として履歴へ積む", () => {
  const selected = ConnectionInteraction.select(
    ConnectionInteraction.create(connectedDocument),
    connectionId,
  );
  const editing = ConnectionInteraction.edit(selected, connectionId);
  const drafted = ConnectionInteraction.changeDraft(editing, "実行");

  expect(drafted.board.workingDocument.connections[0]?.label).toBe("操作");

  const committed = ConnectionInteraction.commitEdit(drafted);
  const undone = ConnectionInteraction.undo(committed);

  expect(committed.board.workingDocument.connections[0]?.label).toBe("実行");
  expect(undone.board.workingDocument.connections[0]?.label).toBe("操作");
});

test("選択中の接続をDelete操作で削除してundoできる", () => {
  const selected = ConnectionInteraction.select(
    ConnectionInteraction.create(connectedDocument),
    connectionId,
  );
  const removed = ConnectionInteraction.pressDelete(selected);
  const restored = ConnectionInteraction.undo(removed);

  expect(removed.board.workingDocument.connections).toHaveLength(0);
  expect(removed.session).toEqual({ status: "idle" });
  expect(restored.board.workingDocument.connections).toEqual([connection]);
});

test("接続モード中の空白クリックは付箋も接続も作成しない", () => {
  const selectingSource = ConnectionInteraction.toggleMode(
    ConnectionInteraction.create(documentWithStickies),
  );
  const clicked = ConnectionInteraction.clickAt(selectingSource, {
    x: 800,
    y: 600,
  });

  expect(clicked.board.workingDocument).toBe(documentWithStickies);
  expect(clicked.session).toEqual({ status: "selectingSource" });
});
