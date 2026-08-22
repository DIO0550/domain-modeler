import { afterEach, expect, test, vi } from "vitest";
import {
  AUTO_SAVE_DEBOUNCE_MS,
  AUTO_SAVE_MAX_INTERVAL_MS,
  AutoSave,
  type AutoSaveOperations,
} from "./autoSave";

type WriteCall = Readonly<{ path: string; contents: string }>;

/**
 * 呼び出し履歴を記録する自動保存用の外部操作を組み立てる。
 *
 * @param writes ファイル書き込みの呼び出し履歴。
 * @returns テスト用の自動保存操作。
 */
const operationsRecording = (writes: WriteCall[]): AutoSaveOperations => ({
  writeFile: async (path, contents) => {
    writes.push({ path, contents });
    return { type: "ok" };
  },
  now: () => Date.now(),
});

afterEach(() => {
  vi.useRealTimers();
});

test("変更から500ms経過すると最新内容を1回だけ書き込む", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsRecording(writes);
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");

  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":1}',
    Date.now(),
  );

  await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS - 1);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  expect(writes).toEqual([]);

  await vi.advanceTimersByTimeAsync(1);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
  expect(autoSave.status).toBe("idle");
});

test("連続変更中は最後の変更から500ms後に保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsRecording(writes);
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");

  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":1}',
    Date.now(),
  );
  await vi.advanceTimersByTimeAsync(300);
  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":2}',
    Date.now(),
  );

  await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS - 1);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  expect(writes).toEqual([]);

  await vi.advanceTimersByTimeAsync(1);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":2}' },
  ]);
});

test("連続変更中は最大2秒で最新内容を保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsRecording(writes);
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");

  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":0}',
    Date.now(),
  );
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  for (const version of Array.from({ length: 19 }, (_, index) => index + 1)) {
    await vi.advanceTimersByTimeAsync(100);
    autoSave = AutoSave.notifyContentsChanged(
      autoSave,
      `{"version":${version}}`,
      Date.now(),
    );
    autoSave = await AutoSave.saveIfDue(autoSave, operations);
  }

  await vi.advanceTimersByTimeAsync(100);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":19}' },
  ]);
});

test("最大間隔で保存した後も変更が続けば次の2秒で再保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsRecording(writes);
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");

  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":0}',
    Date.now(),
  );
  await vi.advanceTimersByTimeAsync(AUTO_SAVE_MAX_INTERVAL_MS);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":1}',
    Date.now(),
  );
  for (const version of Array.from({ length: 19 }, (_, index) => index + 2)) {
    await vi.advanceTimersByTimeAsync(100);
    autoSave = AutoSave.notifyContentsChanged(
      autoSave,
      `{"version":${version}}`,
      Date.now(),
    );
    autoSave = await AutoSave.saveIfDue(autoSave, operations);
  }

  await vi.advanceTimersByTimeAsync(100);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":0}' },
    { path: "/documents/context.dcanvas", contents: '{"version":20}' },
  ]);
});

test("トランザクション中は待機時間が経過しても書き込まない", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsRecording(writes);
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");

  autoSave = AutoSave.beginTransaction(autoSave);
  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":1}',
    Date.now(),
  );
  await vi.advanceTimersByTimeAsync(AUTO_SAVE_MAX_INTERVAL_MS);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);

  expect(writes).toEqual([]);
  expect(autoSave.status).toBe("pending");
  expect(autoSave.transactionDepth).toBe(1);
});

test("トランザクション終了後は未保存変更を保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsRecording(writes);
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");

  autoSave = AutoSave.beginTransaction(autoSave);
  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":1}',
    Date.now(),
  );
  autoSave = AutoSave.endTransaction(autoSave);
  await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);

  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
});

test("トランザクション中でもflushは待たずに保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsRecording(writes);
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");

  autoSave = AutoSave.beginTransaction(autoSave);
  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":1}',
    Date.now(),
  );
  autoSave = await AutoSave.flush(autoSave, operations);

  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
  expect(autoSave.status).toBe("idle");
});

test("書き込み中の変更は完了後も残る", async () => {
  vi.useFakeTimers();
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");
  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":1}',
    Date.now(),
  );

  autoSave = AutoSave.startSaving(autoSave);
  await vi.advanceTimersByTimeAsync(1_000);
  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":2}',
    Date.now(),
  );
  const editedAt = Date.now();
  await vi.advanceTimersByTimeAsync(500);
  autoSave = AutoSave.finishSaving(autoSave, {
    contents: '{"version":1}',
    result: { type: "ok" },
    now: Date.now(),
  });

  expect(autoSave).toMatchObject({
    status: "pending",
    lastSavedContents: '{"version":1}',
    pendingContents: '{"version":2}',
    firstDirtyAt: editedAt,
  });
});

test("保存済み内容に戻すと待機時間後も書き込まない", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsRecording(writes);
  let autoSave = AutoSave.create("/documents/context.dcanvas", "{}");

  autoSave = AutoSave.notifyContentsChanged(
    autoSave,
    '{"version":1}',
    Date.now(),
  );
  autoSave = AutoSave.notifyContentsChanged(autoSave, "{}", Date.now());
  await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
  autoSave = await AutoSave.saveIfDue(autoSave, operations);

  expect(writes).toEqual([]);
  expect(autoSave.status).toBe("idle");
});

test("内容が変わっていないとflushは書き込まない", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations = operationsRecording(writes);
  const autoSave = AutoSave.create("/documents/context.dcanvas", "{}");

  await AutoSave.flush(autoSave, operations);

  expect(writes).toEqual([]);
});
