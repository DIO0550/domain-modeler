import { afterEach, expect, test, vi } from "vitest";
import {
  AUTO_SAVE_DEBOUNCE_MS,
  AUTO_SAVE_MAX_INTERVAL_MS,
  AUTO_SAVE_RETRY_MS,
  AutoSave,
  type AutoSaveOperations,
} from "./autoSave";

type WriteCall = Readonly<{ path: string; contents: string }>;

/**
 * 書き込み失敗を返す自動保存用の外部操作を組み立てる。
 *
 * @param writes ファイル書き込みの呼び出し履歴。
 * @returns テスト用の自動保存操作。
 */
const operationsFailing = (writes: WriteCall[]): AutoSaveOperations => ({
  writeFile: async (path, contents) => {
    writes.push({ path, contents });
    return {
      type: "err",
      error: { kind: "writeFailed", path, message: "disk full" },
    };
  },
  now: () => Date.now(),
});

afterEach(() => {
  vi.useRealTimers();
});

test("書き込み失敗後は再試行間隔の経過後に再度書き込む", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsFailing(writes);
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");
  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":1}',
    Date.now(),
  );

  await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  expect(writes).toHaveLength(1);
  expect(autoSave.status).toBe("failed");

  await vi.advanceTimersByTimeAsync(AUTO_SAVE_RETRY_MS - 1);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  expect(writes).toHaveLength(1);

  await vi.advanceTimersByTimeAsync(1);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
});

test("書き込み失敗後もトランザクション中は再試行しない", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsFailing(writes);
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");
  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":1}',
    Date.now(),
  );
  await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  autoSave = AutoSave.beginTransaction(autoSave);

  await vi.advanceTimersByTimeAsync(AUTO_SAVE_MAX_INTERVAL_MS);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);

  expect(writes).toHaveLength(1);
  expect(autoSave.status).toBe("failed");
});

test("書き込み失敗中の編集は failed のまま再試行間隔を維持する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsFailing(writes);
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");
  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":1}',
    Date.now(),
  );
  await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);

  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":2}',
    Date.now(),
  );
  expect(autoSave).toMatchObject({
    status: "failed",
    pendingContents: '{"version":2}',
    error: { kind: "writeFailed", message: "disk full" },
  });

  await vi.advanceTimersByTimeAsync(AUTO_SAVE_RETRY_MS - 1);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  expect(writes).toHaveLength(1);

  await vi.advanceTimersByTimeAsync(1);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
    { path: "/documents/context.dcanvas", contents: '{"version":2}' },
  ]);
});
