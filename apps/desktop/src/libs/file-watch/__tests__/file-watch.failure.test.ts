import { clearMocks } from "@tauri-apps/api/mocks";
import { afterEach, expect, test } from "vitest";
import { FILE_WATCH_OPERATIONS, type FileWatchEvent } from "../index";
import {
  expectSession,
  setupFileWatch,
  watchFailure,
} from "./file-watch.test-support";

afterEach(clearMocks);

test("監視の開始が拒否された文書にはイベントを通知せず購読も残さない", async () => {
  const backend = setupFileWatch();
  const events: FileWatchEvent[] = [];
  backend.starts.push(() => watchFailure("/a.dmodel"));

  const result = await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
    events.push(event),
  );
  backend.emit({ type: "changed", path: "/a.dmodel" });

  expect(result).toEqual(watchFailure("/a.dmodel"));
  expect(events).toEqual([]);
  expect(backend.listeners.size).toBe(0);
});

test.each([
  new Error("通信失敗"),
  "通信失敗",
])("開始時の通信例外でも購読を解除する (%s)", async (caught) => {
  const backend = setupFileWatch();
  const events: FileWatchEvent[] = [];
  backend.starts.push(() => {
    throw caught;
  });

  const result = await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
    events.push(event),
  );
  backend.emit({ type: "changed", path: "/a.dmodel" });

  expect(result).toEqual({
    type: "err",
    error: { kind: "watchFailed", path: "/a.dmodel", message: "通信失敗" },
  });
  expect(events).toEqual([]);
  expect(backend.listeners.size).toBe(0);
});

test("再開を拒否されたときは失敗を通知し再読込を要求しない", async () => {
  const backend = setupFileWatch();
  const events: FileWatchEvent[] = [];
  const session = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
      events.push(event),
    ),
  );
  backend.starts.push(() => watchFailure("/a.dmodel"));

  backend.emit({ type: "watchFailed", path: "/a.dmodel", message: "監視停止" });

  await expect
    .poll(() => events)
    .toEqual([
      { type: "watchFailed", path: "/a.dmodel", message: "監視停止" },
      { type: "watchFailed", path: "/a.dmodel", message: "監視を開始できない" },
    ]);
  await session.stop();
  expect(backend.registrations.get("/a.dmodel")).toBe(0);
});

test.each([
  "start",
  "stop",
] as const)("再開中の%s通信例外を通知した後も終了できる", async (command) => {
  const backend = setupFileWatch();
  const events: FileWatchEvent[] = [];
  const session = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
      events.push(event),
    ),
  );
  const responses = command === "start" ? backend.starts : backend.stops;
  responses.push(() => {
    throw new Error("通信失敗");
  });

  backend.emit({ type: "watchFailed", path: "/a.dmodel", message: "監視停止" });

  await expect
    .poll(() => events)
    .toContainEqual({
      type: "watchFailed",
      path: "/a.dmodel",
      message: "通信失敗",
    });
  await session.stop();
  expect(backend.listeners.size).toBe(0);
  expect(backend.registrations.get("/a.dmodel")).toBe(0);
});

test.each([
  "start",
  "stop",
] as const)("再開の%s通信例外の後でも次の監視失敗から回復できる", async (command) => {
  const backend = setupFileWatch();
  const events: FileWatchEvent[] = [];
  const session = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
      events.push(event),
    ),
  );
  const responses = command === "start" ? backend.starts : backend.stops;
  responses.push(() => {
    throw "通信失敗";
  });
  backend.emit({ type: "watchFailed", path: "/a.dmodel", message: "監視停止" });
  await expect
    .poll(() => events)
    .toContainEqual({
      type: "watchFailed",
      path: "/a.dmodel",
      message: "通信失敗",
    });

  backend.emit({ type: "watchFailed", path: "/a.dmodel", message: "再試行" });

  await expect
    .poll(() => events[events.length - 1])
    .toEqual({ type: "changed", path: "/a.dmodel" });
  expect(backend.registrations.get("/a.dmodel")).toBe(1);
  await session.stop();
});

test("再開前の停止を拒否されたときは重複登録せず失敗を通知する", async () => {
  const backend = setupFileWatch();
  const events: FileWatchEvent[] = [];
  const session = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
      events.push(event),
    ),
  );
  backend.stops.push(() => watchFailure("/a.dmodel"));

  backend.emit({ type: "watchFailed", path: "/a.dmodel", message: "監視停止" });

  await expect
    .poll(() => events)
    .toEqual([
      { type: "watchFailed", path: "/a.dmodel", message: "監視停止" },
      { type: "watchFailed", path: "/a.dmodel", message: "監視を開始できない" },
    ]);
  expect(backend.registrations.get("/a.dmodel")).toBe(1);
  await session.stop();
  expect(backend.registrations.get("/a.dmodel")).toBe(0);
});

test("同じ文書の再開失敗した購読を閉じても別の購読の監視は残る", async () => {
  const backend = setupFileWatch();
  const firstEvents: FileWatchEvent[] = [];
  const secondEvents: FileWatchEvent[] = [];
  const first = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
      firstEvents.push(event),
    ),
  );
  const second = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
      secondEvents.push(event),
    ),
  );
  backend.starts.push(() => watchFailure("/a.dmodel"));

  backend.emit({ type: "watchFailed", path: "/a.dmodel", message: "監視停止" });
  await expect
    .poll(() => firstEvents)
    .toContainEqual({
      type: "watchFailed",
      path: "/a.dmodel",
      message: "監視を開始できない",
    });
  await expect
    .poll(() => secondEvents)
    .toContainEqual({ type: "changed", path: "/a.dmodel" });
  await first.stop();

  expect(backend.registrations.get("/a.dmodel")).toBe(1);
  expect(backend.listeners.size).toBe(1);
  await second.stop();
  expect(backend.registrations.get("/a.dmodel")).toBe(0);
});
