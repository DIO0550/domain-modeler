import type { FileWriteError, FileWriteResult } from "./fileActions";

export const AUTO_SAVE_DEBOUNCE_MS = 500;
export const AUTO_SAVE_MAX_INTERVAL_MS = 2_000;

/** 自動保存の現在状態。 */
export type AutoSaveStatus =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "pending" }>
  | Readonly<{ status: "saving" }>
  | Readonly<{ status: "failed"; error: FileWriteError }>;

/** 自動保存がファイルへ書き込むための外部操作。 */
export type AutoSaveOperations = Readonly<{
  writeFile: (path: string, contents: string) => Promise<FileWriteResult>;
  now: () => number;
}>;

/** 1つの文書の保存予約・トランザクション・終了時保存を扱う操作群。 */
export type AutoSaveScheduler = Readonly<{
  notifyContentsChanged: (contents: string) => void;
  beginTransaction: () => void;
  endTransaction: () => void;
  flush: () => Promise<void>;
  dispose: () => void;
  status: () => AutoSaveStatus;
}>;

type Timer = ReturnType<typeof setTimeout>;

/**
 * 文書単位の自動保存スケジューラを作成する。
 *
 * @param path 保存対象のファイルパス。
 * @param initialContents 開いた時点でファイルへ保存済みの内容。
 * @param operations ファイル書き込みと時刻取得を行う外部操作。
 * @returns 文書変更・トランザクション・終了時保存を扱うスケジューラ。
 */
const create = (
  path: string,
  initialContents: string,
  operations: AutoSaveOperations,
): AutoSaveScheduler => {
  let lastSavedContents = initialContents;
  let pendingContents = initialContents;
  let lastChangedAt: number | undefined;
  let firstDirtyAt: number | undefined;
  let transactionDepth = 0;
  let debounceTimer: Timer | undefined;
  let maxIntervalTimer: Timer | undefined;
  let writePromise: Promise<boolean> | undefined;
  let currentStatus: AutoSaveStatus = { status: "idle" };

  const cancelTimers = (): void => {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
    if (maxIntervalTimer !== undefined) {
      clearTimeout(maxIntervalTimer);
      maxIntervalTimer = undefined;
    }
  };

  const resetToIdle = (): void => {
    cancelTimers();
    lastChangedAt = undefined;
    firstDirtyAt = undefined;
    currentStatus = { status: "idle" };
  };

  const isDirty = (): boolean => pendingContents !== lastSavedContents;

  const scheduleSave = (): void => {
    if (!isDirty()) {
      resetToIdle();
      return;
    }
    if (transactionDepth > 0 || writePromise !== undefined) {
      return;
    }

    const now = operations.now();
    const changedAt = lastChangedAt ?? now;
    const dirtyAt = firstDirtyAt ?? now;
    const debounceDelay = Math.max(0, changedAt + AUTO_SAVE_DEBOUNCE_MS - now);
    const maxIntervalDelay = Math.max(
      0,
      dirtyAt + AUTO_SAVE_MAX_INTERVAL_MS - now,
    );
    currentStatus = { status: "pending" };

    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      void writeCurrent(false);
    }, debounceDelay);

    if (maxIntervalTimer === undefined) {
      maxIntervalTimer = setTimeout(() => {
        maxIntervalTimer = undefined;
        void writeCurrent(false);
      }, maxIntervalDelay);
    }
  };

  const writeCurrent = async (force: boolean): Promise<boolean> => {
    if (writePromise !== undefined) {
      return writePromise;
    }
    if (!force && transactionDepth > 0) {
      return false;
    }
    if (!isDirty()) {
      resetToIdle();
      return true;
    }

    cancelTimers();
    const contents = pendingContents;
    currentStatus = { status: "saving" };
    writePromise = operations.writeFile(path, contents).then((result) => {
      writePromise = undefined;
      if (result.type === "err") {
        currentStatus = { status: "failed", error: result.error };
        return false;
      }

      lastSavedContents = contents;
      if (!isDirty()) {
        resetToIdle();
        return true;
      }

      firstDirtyAt = operations.now();
      scheduleSave();
      return true;
    });
    return writePromise;
  };

  return {
    notifyContentsChanged: (contents) => {
      pendingContents = contents;
      lastChangedAt = operations.now();
      if (firstDirtyAt === undefined && isDirty()) {
        firstDirtyAt = lastChangedAt;
      }
      scheduleSave();
    },
    beginTransaction: () => {
      transactionDepth += 1;
      cancelTimers();
    },
    endTransaction: () => {
      if (transactionDepth === 0) {
        return;
      }
      transactionDepth -= 1;
      if (transactionDepth === 0) {
        scheduleSave();
      }
    },
    flush: async () => {
      cancelTimers();
      let writeSucceeded = true;
      while (isDirty() && writeSucceeded) {
        writeSucceeded = await writeCurrent(true);
      }
    },
    dispose: () => {
      cancelTimers();
    },
    status: () => currentStatus,
  };
};

/** 文書単位の自動保存スケジューラを扱う関数群。 */
export const AutoSave = {
  create,
} as const;
