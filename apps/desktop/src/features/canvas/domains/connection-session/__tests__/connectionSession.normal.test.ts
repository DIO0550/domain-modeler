import { expect, test } from "vitest";
import { ConnectionId, StickyId } from "@domain-modeler/canvas-core";
import { ConnectionSession } from "..";

test("始点または終点の選択中だけ接続作成中になる", () => {
  expect(ConnectionSession.isCreating({ status: "idle" })).toBe(false);
  expect(ConnectionSession.isCreating({ status: "selectingSource" })).toBe(true);
  expect(
    ConnectionSession.isCreating({
      status: "selectingTarget",
      sourceId: StickyId.create("stk_source00000"),
    }),
  ).toBe(true);
});

test("対象の接続だけ選択または編集中の表示になる", () => {
  const selectedId = ConnectionId.create("con_selected000");
  const otherId = ConnectionId.create("con_other000000");
  const selected = { status: "selected", connectionId: selectedId } as const;

  expect(ConnectionSession.statusOf(selected, selectedId)).toBe("selected");
  expect(ConnectionSession.statusOf(selected, otherId)).toBe("plain");
});

test("終点選択中に選んだ始点だけを始点として判定する", () => {
  const sourceId = StickyId.create("stk_source00000");
  const session = { status: "selectingTarget", sourceId } as const;

  expect(ConnectionSession.isSource(session, sourceId)).toBe(true);
  expect(
    ConnectionSession.isSource(
      session,
      StickyId.create("stk_target00000"),
    ),
  ).toBe(false);
});
