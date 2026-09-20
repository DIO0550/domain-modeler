import { act } from "react";
import type { AutoSaveOperations } from "@/features/auto-save";
import type { FileWatchEvent, FileWatchOperations } from "@/libs/file-watch";

/**
 * 1回目の書き込みだけを保留し、2回目以降は即座に成功させる自動保存操作を組み立てる。
 *
 * @param writes 書き込まれた内容の記録先。
 * @returns 自動保存操作と、保留中の1回目を完了させる操作。
 */
export const autoSaveBlockingFirstWrite = (
  writes: string[],
): Readonly<{ operations: AutoSaveOperations; finishFirstWrite: () => void }> => {
  const pending = { finish: () => {} };
  return {
    operations: {
      writeFile: async (_path, contents) => {
        writes.push(contents);
        if (writes.length > 1) {
          return { type: "ok" };
        }
        return await new Promise((resolve) => {
          pending.finish = () => resolve({ type: "ok" });
        });
      },
      now: Date.now,
    },
    finishFirstWrite: () => pending.finish(),
  };
};

/**
 * 1回目の読み込みだけを保留し、2回目以降は既定の内容を返すファイル監視操作を組み立てる。
 *
 * @param laterContents 2回目以降の読み込みが返す内容。
 * @returns 監視操作、変更イベントの送出、保留中の1回目を完了させる操作、その待機状態。
 */
export const fileWatchDeferringFirstRead = (
  laterContents: string,
): Readonly<{
  operations: FileWatchOperations;
  notify: (event: FileWatchEvent) => void;
  finishFirstRead: (contents: string) => void;
  isFirstReadPending: () => boolean;
}> => {
  const listener = { notify: (_event: FileWatchEvent) => {} };
  const pending: { finish: ((contents: string) => void) | undefined } = {
    finish: undefined,
  };
  let readCount = 0;
  return {
    operations: {
      watch: async (_path, onEvent) => {
        listener.notify = onEvent;
        return { type: "ok", stop: async () => {} };
      },
      readFile: async () => {
        readCount += 1;
        if (readCount > 1) {
          return { type: "ok", value: laterContents };
        }
        return await new Promise((resolve) => {
          pending.finish = (contents) => resolve({ type: "ok", value: contents });
        });
      },
    },
    notify: (event) => listener.notify(event),
    finishFirstRead: (contents) => pending.finish?.(contents),
    isFirstReadPending: () => pending.finish !== undefined,
  };
};

/**
 * アクティブキャンバスへ undo ショートカットを送る。
 *
 * @param host 描画先のホスト要素。
 */
export const undoCanvas = (host: HTMLDivElement): void => {
  const surface = host.querySelector(".canvas-surface");
  if (surface === null) {
    throw new Error("キャンバスがありません");
  }
  act(() =>
    surface.dispatchEvent(
      new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }),
    ),
  );
};
