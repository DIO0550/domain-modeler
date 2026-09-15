import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
type FileReadError =
  | Readonly<{ kind: "notFound"; path: string }>
  | Readonly<{ kind: "invalidUtf8"; path: string }>
  | Readonly<{ kind: "readFailed"; path: string; message: string }>;

type FileReadResult =
  | Readonly<{ type: "ok"; value: string }>
  | Readonly<{ type: "err"; error: FileReadError }>;

export type FileWatchEvent = Readonly<{
  type: "changed" | "deleted";
  path: string;
}>;

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

const watch = async (
  path: string,
  onEvent: (event: FileWatchEvent) => void,
): Promise<FileWatchSessionResult> => {
  try {
    const unlisten = await listen<FileWatchEvent>("file-watch", (event) => {
      if (event.payload.path === path) {
        onEvent(event.payload);
      }
    });
    const result = await invoke<FileWatchResult>("start_file_watch", { path });
    if (result.type === "err") {
      unlisten();
      return result;
    }
    return {
      type: "ok",
      stop: async () => {
        unlisten();
        await invoke<FileWatchResult>("stop_file_watch", { path });
      },
    };
  } catch (caught) {
    return {
      type: "err",
      error: {
        kind: "watchFailed",
        path,
        message: caught instanceof Error ? caught.message : String(caught),
      },
    };
  }
};

export const FILE_WATCH_OPERATIONS: FileWatchOperations = {
  watch,
  readFile: (path) => invoke<FileReadResult>("read_file", { path }),
};
