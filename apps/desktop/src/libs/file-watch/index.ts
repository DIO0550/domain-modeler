import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

type FileReadError =
  | Readonly<{ kind: "notFound"; path: string }>
  | Readonly<{ kind: "invalidUtf8"; path: string }>
  | Readonly<{ kind: "readFailed"; path: string; message: string }>;

type FileReadResult =
  | Readonly<{ type: "ok"; value: string }>
  | Readonly<{ type: "err"; error: FileReadError }>;

export type FileWatchEvent =
  | Readonly<{ type: "changed" | "deleted"; path: string }>
  | Readonly<{ type: "watchFailed"; path: string; message: string }>;

type FileWatchError = Readonly<{
  kind: "watchFailed";
  path: string;
  message: string;
}>;

type FileWatchResult =
  | Readonly<{ type: "ok" }>
  | Readonly<{ type: "err"; error: FileWatchError }>;

export type FileWatchSessionResult =
  | Readonly<{ type: "ok"; stop: () => Promise<void> }>
  | Readonly<{ type: "err"; error: FileWatchError }>;

export type FileWatchOperations = Readonly<{
  watch: (
    path: string,
    onEvent: (event: FileWatchEvent) => void,
  ) => Promise<FileWatchSessionResult>;
  readFile: (path: string) => Promise<FileReadResult>;
}>;

const watchFailure = (path: string, caught: unknown) => ({
  type: "err" as const,
  error: {
    kind: "watchFailed" as const,
    path,
    message: caught instanceof Error ? caught.message : String(caught),
  },
});

const watchCommand = async (
  command: "start_file_watch" | "stop_file_watch",
  path: string,
): Promise<FileWatchResult> => {
  try {
    return await invoke<FileWatchResult>(command, { path });
  } catch (caught) {
    return watchFailure(path, caught);
  }
};

const watch = async (
  path: string,
  onEvent: (event: FileWatchEvent) => void,
): Promise<FileWatchSessionResult> => {
  try {
    let active = true;
    let registrationReleased = false;
    let restart = Promise.resolve();
    const unlisten = await listen<FileWatchEvent>("file-watch", (event) => {
      if (event.payload.path !== path || !active) {
        return;
      }

      onEvent(event.payload);

      if (event.payload.type !== "watchFailed") {
        return;
      }

      restart = restart.then(async () => {
        if (!active) {
          return;
        }

        const stopped = registrationReleased
          ? { type: "ok" as const }
          : await watchCommand("stop_file_watch", path);
        registrationReleased = stopped.type === "ok";

        if (!active) {
          return;
        }

        if (stopped.type === "err") {
          onEvent({
            type: "watchFailed",
            path,
            message: stopped.error.message,
          });

          return;
        }

        const restarted = await watchCommand("start_file_watch", path);
        registrationReleased = restarted.type === "err";

        if (!active) {
          return;
        }

        if (restarted.type === "err") {
          onEvent({
            type: "watchFailed",
            path,
            message: restarted.error.message,
          });

          return;
        }

        // 再開直後に現在の内容を読み直し、停止中の変更を取りこぼさない。
        onEvent({ type: "changed", path });
      });
    });
    const result = await watchCommand("start_file_watch", path);

    if (result.type === "err") {
      active = false;
      unlisten();

      return result;
    }

    return {
      type: "ok",

      stop: async () => {
        active = false;
        unlisten();
        await restart;

        // 再開失敗や停止待機中の終了で、他の購読の登録を減らさない。
        if (registrationReleased) {
          return;
        }

        const stopped = await invoke<FileWatchResult>("stop_file_watch", {
          path,
        });
        registrationReleased = stopped.type === "ok";
      },
    };
  } catch (caught) {
    return watchFailure(path, caught);
  }
};

export const FILE_WATCH_OPERATIONS: FileWatchOperations = {
  watch,

  readFile: (path) => invoke<FileReadResult>("read_file", { path }),
};
