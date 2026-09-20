import { expect, test } from "vitest";
import { AutoSave } from "..";

test("未保存文書は編集しても自動保存を予約せず書き込み状態にも移らない", () => {
  const draft = AutoSave.notifyContentsChanged(
    AutoSave.create({ draftId: "draft-1" }, ""),
    "edited",
    100,
  );
  expect(AutoSave.due(draft, 10_000)).toEqual({ status: "notScheduled" });
  expect(AutoSave.startSaving(draft)).toEqual(draft);
  expect(AutoSave.isDirty(draft)).toBe(true);
});

test("初回保存中の追加編集を保存先への次の書き込みとして保持する", () => {
  const draft = AutoSave.notifyContentsChanged(
    AutoSave.create({ draftId: "draft-1" }, ""),
    "latest",
    100,
  );
  const attached = AutoSave.attachFile(
    draft,
    { path: "/draft.dmodel", contents: "before" },
    200,
  );
  expect(attached).toMatchObject({
    status: "pending",
    path: "/draft.dmodel",
    pendingContents: "latest",
    lastSavedContents: "before",
  });
});

test("空の文書でも初回保存前は未保存と判定する", () => {
  expect(AutoSave.isDirty(AutoSave.create({ draftId: "draft-1" }, ""))).toBe(
    true,
  );
});
