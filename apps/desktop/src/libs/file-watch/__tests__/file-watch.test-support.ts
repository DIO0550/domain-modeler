import { mockIPC } from "@tauri-apps/api/mocks";
import { expect } from "vitest";
import type { FileWatchEvent, FileWatchSessionResult } from "../index";

type WatchResult =
  | Readonly<{ type: "ok" }>
  | Readonly<{
      type: "err";
      error: Readonly<{ kind: "watchFailed"; path: string; message: string }>;
    }>;

type CommandResponse = () => WatchResult | Promise<WatchResult>;

export const setupFileWatch = () => {
  const listeners = new Set<number>();
  const registrations = new Map<string, number>();
  const starts: CommandResponse[] = [];
  const stops: CommandResponse[] = [];
  const commands: string[] = [];

  mockIPC(async (command, payload) => {
    const args = payload as Record<string, unknown>;

    if (command === "plugin:event|listen") {
      expect(args.event).toBe("file-watch");
      expect(typeof args.handler).toBe("number");
      const id = Number(args.handler);
      listeners.add(id);

      return id;
    }

    if (command === "plugin:event|unlisten") {
      listeners.delete(Number(args.eventId));

      return;
    }

    expect(typeof args.path).toBe("string");
    const path = String(args.path);
    commands.push(command);

    if (command === "start_file_watch") {
      const response = await (starts.shift()?.() ?? { type: "ok" });

      if (response.type === "ok") {
        registrations.set(path, (registrations.get(path) ?? 0) + 1);
      }

      return response;
    }

    if (command === "stop_file_watch") {
      const response = await (stops.shift()?.() ?? { type: "ok" });

      if (response.type === "ok") {
        registrations.set(
          path,
          Math.max(0, (registrations.get(path) ?? 0) - 1),
        );
      }

      return response;
    }

    throw new Error(`想定外のIPC: ${command}`);
  });

  return {
    listeners,
    registrations,
    starts,
    stops,
    commands,
    emit: (payload: FileWatchEvent) => {
      // Tauri が登録したコールバックへ境界イベントを届ける。
      const internals = Reflect.get(window, "__TAURI_INTERNALS__");
      const runCallback = Reflect.get(internals, "runCallback");

      for (const id of listeners) {
        runCallback(id, { event: "file-watch", id, payload });
      }
    },
  };
};

export const expectSession = (result: FileWatchSessionResult) => {
  expect(result.type).toBe("ok");

  if (result.type !== "ok") {
    throw new Error("監視の開始に失敗した");
  }

  return result;
};

export const setupPendingCommand = () => {
  let complete = (_result: WatchResult) => {};
  const promise = new Promise<WatchResult>((resolve) => {
    complete = resolve;
  });

  return { promise, complete };
};

export const watchFailure = (path: string) => ({
  type: "err" as const,
  error: { kind: "watchFailed" as const, path, message: "監視を開始できない" },
});
