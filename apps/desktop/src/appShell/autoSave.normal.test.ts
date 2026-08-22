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
  const scheduler = AutoSave.create(
    "/documents/context.dcanvas",
    "{}",
    operationsRecording(writes),
  );

  scheduler.notifyContentsChanged('{"version":1}');

  await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS - 1);
  expect(writes).toEqual([]);

  await vi.advanceTimersByTimeAsync(1);
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
  expect(scheduler.status()).toEqual({ status: "idle" });
});

test("連続変更中は最後の変更から500ms後に保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const scheduler = AutoSave.create(
    "/documents/context.dcanvas",
    "{}",
    operationsRecording(writes),
  );

  scheduler.notifyContentsChanged('{"version":1}');
  await vi.advanceTimersByTimeAsync(300);
  scheduler.notifyContentsChanged('{"version":2}');

  await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS - 1);
  expect(writes).toEqual([]);

  await vi.advanceTimersByTimeAsync(1);
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":2}' },
  ]);
});

test("連続変更中は最大2秒で最新内容を保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const scheduler = AutoSave.create(
    "/documents/context.dcanvas",
    "{}",
    operationsRecording(writes),
  );

  scheduler.notifyContentsChanged('{"version":0}');
  for (const version of Array.from({ length: 19 }, (_, index) => index + 1)) {
    await vi.advanceTimersByTimeAsync(100);
    scheduler.notifyContentsChanged(`{"version":${version}}`);
  }

  await vi.advanceTimersByTimeAsync(100);
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":19}' },
  ]);
});

test("最大間隔で保存した後も変更が続けば次の2秒で再保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const scheduler = AutoSave.create(
    "/documents/context.dcanvas",
    "{}",
    operationsRecording(writes),
  );

  scheduler.notifyContentsChanged('{"version":0}');
  await vi.advanceTimersByTimeAsync(AUTO_SAVE_MAX_INTERVAL_MS);
  scheduler.notifyContentsChanged('{"version":1}');
  for (const version of Array.from({ length: 19 }, (_, index) => index + 2)) {
    await vi.advanceTimersByTimeAsync(100);
    scheduler.notifyContentsChanged(`{"version":${version}}`);
  }

  await vi.advanceTimersByTimeAsync(100);
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":0}' },
    { path: "/documents/context.dcanvas", contents: '{"version":20}' },
  ]);
});

test("トランザクション中は待機時間が経過しても書き込まない", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const scheduler = AutoSave.create(
    "/documents/context.dcanvas",
    "{}",
    operationsRecording(writes),
  );

  scheduler.beginTransaction();
  scheduler.notifyContentsChanged('{"version":1}');
  await vi.advanceTimersByTimeAsync(AUTO_SAVE_MAX_INTERVAL_MS);

  expect(writes).toEqual([]);
  expect(scheduler.status()).toEqual({ status: "idle" });
});

test("トランザクション終了後は未保存変更を保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const scheduler = AutoSave.create(
    "/documents/context.dcanvas",
    "{}",
    operationsRecording(writes),
  );

  scheduler.beginTransaction();
  scheduler.notifyContentsChanged('{"version":1}');
  scheduler.endTransaction();
  await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);

  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
});

test("トランザクション中でもflushは待たずに保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const scheduler = AutoSave.create(
    "/documents/context.dcanvas",
    "{}",
    operationsRecording(writes),
  );

  scheduler.beginTransaction();
  scheduler.notifyContentsChanged('{"version":1}');
  await scheduler.flush();

  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
  expect(scheduler.status()).toEqual({ status: "idle" });
});

test("内容が変わっていないとflushは書き込まない", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const scheduler = AutoSave.create(
    "/documents/context.dcanvas",
    "{}",
    operationsRecording(writes),
  );

  await scheduler.flush();

  expect(writes).toEqual([]);
});
