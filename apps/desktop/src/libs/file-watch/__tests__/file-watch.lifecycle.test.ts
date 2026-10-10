import { clearMocks } from "@tauri-apps/api/mocks";
import { afterEach, expect, test } from "vitest";
import { FILE_WATCH_OPERATIONS, type FileWatchEvent } from "../index";
import {
  expectSession,
  setupFileWatch,
  setupPendingCommand,
} from "./file-watch.test-support";

afterEach(clearMocks);

test.each([
  "start",
  "stop",
] as const)("再開の%s待機中に閉じた文書には通知せず監視を残さない", async (command) => {
  const backend = setupFileWatch();
  const pending = setupPendingCommand();
  const events: FileWatchEvent[] = [];
  const session = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
      events.push(event),
    ),
  );
  const responses = command === "start" ? backend.starts : backend.stops;
  responses.push(() => pending.promise);
  backend.emit({ type: "watchFailed", path: "/a.dmodel", message: "監視停止" });
  const expectedCommands =
    command === "start"
      ? ["start_file_watch", "stop_file_watch", "start_file_watch"]
      : ["start_file_watch", "stop_file_watch"];
  await expect.poll(() => backend.commands).toEqual(expectedCommands);

  const closing = session.stop();
  backend.emit({ type: "changed", path: "/a.dmodel" });
  pending.complete({ type: "ok" });
  await closing;

  expect(events).toEqual([
    { type: "watchFailed", path: "/a.dmodel", message: "監視停止" },
  ]);
  expect(backend.registrations.get("/a.dmodel")).toBe(0);
  expect(backend.listeners.size).toBe(0);
});

test("監視停止中の変更を取り込むため再開後に必ず再読込を要求する", async () => {
  const backend = setupFileWatch();
  const pending = setupPendingCommand();
  const events: FileWatchEvent[] = [];
  const session = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
      events.push(event),
    ),
  );
  backend.starts.push(() => pending.promise);
  backend.emit({ type: "watchFailed", path: "/a.dmodel", message: "監視停止" });
  await expect.poll(() => backend.registrations.get("/a.dmodel")).toBe(0);

  // 監視のない間にディスクが変更されてもイベントは来ない。
  pending.complete({ type: "ok" });

  await expect
    .poll(() => events)
    .toEqual([
      { type: "watchFailed", path: "/a.dmodel", message: "監視停止" },
      { type: "changed", path: "/a.dmodel" },
    ]);
  await session.stop();
});

test("別文書の変更・削除・監視失敗は他の文書へ伝播しない", async () => {
  const backend = setupFileWatch();
  const firstEvents: FileWatchEvent[] = [];
  const secondEvents: FileWatchEvent[] = [];
  const first = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
      firstEvents.push(event),
    ),
  );
  const second = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/b.dmodel", (event) =>
      secondEvents.push(event),
    ),
  );

  backend.emit({ type: "changed", path: "/b.dmodel" });
  backend.emit({ type: "deleted", path: "/b.dmodel" });
  backend.emit({ type: "watchFailed", path: "/b.dmodel", message: "監視停止" });
  await expect.poll(() => secondEvents.length).toBe(4);
  await second.stop();
  backend.emit({ type: "changed", path: "/a.dmodel" });

  expect(firstEvents).toEqual([{ type: "changed", path: "/a.dmodel" }]);
  expect(secondEvents).toEqual([
    { type: "changed", path: "/b.dmodel" },
    { type: "deleted", path: "/b.dmodel" },
    { type: "watchFailed", path: "/b.dmodel", message: "監視停止" },
    { type: "changed", path: "/b.dmodel" },
  ]);
  expect(backend.registrations.get("/a.dmodel")).toBe(1);
  await first.stop();
});

test("同じ文書の停止待機中に片方を閉じてももう片方の監視は残る", async () => {
  const backend = setupFileWatch();
  const pending = setupPendingCommand();
  const secondEvents: FileWatchEvent[] = [];
  const first = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/a.dmodel", () => {}),
  );
  const second = expectSession(
    await FILE_WATCH_OPERATIONS.watch("/a.dmodel", (event) =>
      secondEvents.push(event),
    ),
  );
  backend.stops.push(() => pending.promise);
  backend.emit({ type: "watchFailed", path: "/a.dmodel", message: "監視停止" });
  await expect
    .poll(() => secondEvents)
    .toContainEqual({ type: "changed", path: "/a.dmodel" });

  const closing = first.stop();
  pending.complete({ type: "ok" });
  await closing;

  expect(backend.registrations.get("/a.dmodel")).toBe(1);
  await second.stop();
  expect(backend.registrations.get("/a.dmodel")).toBe(0);
});
