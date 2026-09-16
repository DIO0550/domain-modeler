import { expect, test } from "vitest";
import { flushStableSaveSession, flushStableSaveSessions } from "./App";

test("終了保存中に再編集された文書も次の世代までflushする", async () => {
  let finishSlowSave: (saved: boolean) => void = () => {};
  let slowFlushCount = 0;
  let latestFlushCount = 0;
  const sessions = new Map<string, () => Promise<boolean>>();
  sessions.set(
    "/slow.dmodel",
    async () => {
      slowFlushCount += 1;
      if (slowFlushCount > 1) {
        return true;
      }
      return await new Promise<boolean>((resolve) => {
        finishSlowSave = resolve;
      });
    },
  );
  sessions.set("/edited.dmodel", async () => true);

  const closing = flushStableSaveSessions(sessions);
  await Promise.resolve();
  sessions.set("/edited.dmodel", async () => {
    latestFlushCount += 1;
    return true;
  });
  finishSlowSave(true);

  await expect(closing).resolves.toBe(true);
  expect(latestFlushCount).toBe(1);
});

test("いずれかの保存に失敗したら終了を許可しない", async () => {
  const sessions = new Map<string, () => Promise<boolean>>([
    ["/failed.dmodel", async () => false],
  ]);

  await expect(flushStableSaveSessions(sessions)).resolves.toBe(false);
});

test("タブ終了保存中に新しい保存世代が登録されたら再flushする", async () => {
  let finishSlowSave: (saved: boolean) => void = () => {};
  let latestFlushCount = 0;
  const sessions = new Map<string, () => Promise<boolean>>();
  sessions.set(
    "/edited.dcanvas",
    async () =>
      await new Promise<boolean>((resolve) => {
        finishSlowSave = resolve;
      }),
  );

  const closing = flushStableSaveSession(sessions, "/edited.dcanvas");
  await Promise.resolve();
  sessions.set("/edited.dcanvas", async () => {
    latestFlushCount += 1;
    return true;
  });
  finishSlowSave(true);

  await expect(closing).resolves.toBe(true);
  expect(latestFlushCount).toBe(1);
});
