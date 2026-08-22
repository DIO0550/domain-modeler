import type { FileWriteError, FileWriteResult } from "./fileActions";

export const AUTO_SAVE_DEBOUNCE_MS = 500;
export const AUTO_SAVE_MAX_INTERVAL_MS = 2_000;

/** 未保存変更がない自動保存状態。 */
export type IdleAutoSave = Readonly<{
  status: "idle";
  path: string;
  lastSavedContents: string;
  transactionDepth: number;
}>;

/** 未保存変更があり、デバウンスまたは最大間隔の経過を待っている状態。 */
export type PendingAutoSave = Readonly<{
  status: "pending";
  path: string;
  lastSavedContents: string;
  pendingContents: string;
  lastChangedAt: number;
  firstDirtyAt: number;
  transactionDepth: number;
}>;

/** 未保存変更を書き込み中の状態。 */
export type SavingAutoSave = Readonly<{
  status: "saving";
  path: string;
  lastSavedContents: string;
  pendingContents: string;
  writingContents: string;
  lastChangedAt: number;
  firstDirtyAt: number;
  transactionDepth: number;
}>;

/** 直近の書き込みに失敗し、未保存変更が残っている状態。 */
export type FailedAutoSave = Readonly<{
  status: "failed";
  path: string;
  lastSavedContents: string;
  pendingContents: string;
  lastChangedAt: number;
  firstDirtyAt: number;
  transactionDepth: number;
  error: FileWriteError;
}>;

/** 文書単位の自動保存状態。 */
export type AutoSave =
  | IdleAutoSave
  | PendingAutoSave
  | SavingAutoSave
  | FailedAutoSave;

/** 次の自動保存までの待ち時間。 */
export type AutoSaveDue =
  | Readonly<{ status: "notScheduled" }>
  | Readonly<{ status: "scheduled"; delayMs: number }>;

/** 自動保存がファイルへ書き込むための外部操作。 */
export type AutoSaveOperations = Readonly<{
  writeFile: (path: string, contents: string) => Promise<FileWriteResult>;
  now: () => number;
}>;

/** 書き込み完了を状態へ反映するための結果。 */
export type AutoSaveWriteOutcome = Readonly<{
  contents: string;
  result: FileWriteResult;
}>;

/** 文書単位の自動保存状態を扱う関数群。 */
export const AutoSave = {
  /**
   * 開いた時点でファイルへ保存済みの内容から、自動保存状態を生成する。
   *
   * @param path 保存対象のファイルパス。
   * @param initialContents 開いた時点でファイルへ保存済みの内容。
   * @returns 未保存変更のない自動保存状態。
   */
  create(path: string, initialContents: string): AutoSave {
    return {
      status: "idle",
      path,
      lastSavedContents: initialContents,
      transactionDepth: 0,
    };
  },

  /**
   * 文書内容の変更を反映し、保存待ちを更新する。
   *
   * @param autoSave 更新前の自動保存状態。
   * @param contents 変更後の文書内容。
   * @param now 変更が起きた時刻。
   * @returns 更新後の自動保存状態。
   */
  notifyContentsChanged(
    autoSave: AutoSave,
    contents: string,
    now: number,
  ): AutoSave {
    if (contents === autoSave.lastSavedContents) {
      if (autoSave.status !== "saving") {
        return toIdle(autoSave, contents);
      }
      return withPendingContents(autoSave, contents, now);
    }
    if (autoSave.status === "idle") {
      return toPending(autoSave, contents, now, now);
    }
    return withPendingContents(autoSave, contents, now);
  },

  /**
   * 連続操作のトランザクションを開始し、確定まで自動保存しない。
   *
   * @param autoSave 更新前の自動保存状態。
   * @returns トランザクション深度を1増やした状態。
   */
  beginTransaction(autoSave: AutoSave): AutoSave {
    return withTransactionDepth(autoSave, autoSave.transactionDepth + 1);
  },

  /**
   * トランザクションを1段終了する。ネストが残っている間は保存しない。
   *
   * @param autoSave 更新前の自動保存状態。
   * @returns トランザクション深度を1減らした状態。既に0ならそのまま。
   */
  endTransaction(autoSave: AutoSave): AutoSave {
    if (autoSave.transactionDepth === 0) {
      return autoSave;
    }
    return withTransactionDepth(autoSave, autoSave.transactionDepth - 1);
  },

  /**
   * 次の自動保存までの待ち時間を返す。
   *
   * @param autoSave 判定する自動保存状態。
   * @param now 判定時刻。
   * @returns 保存しないときは notScheduled、待つときは delayMs。
   */
  due(autoSave: AutoSave, now: number): AutoSaveDue {
    if (autoSave.status !== "pending") {
      return { status: "notScheduled" };
    }
    if (autoSave.transactionDepth > 0) {
      return { status: "notScheduled" };
    }
    if (!AutoSave.isDirty(autoSave)) {
      return { status: "notScheduled" };
    }

    const debounceAt = autoSave.lastChangedAt + AUTO_SAVE_DEBOUNCE_MS;
    const maxIntervalAt = autoSave.firstDirtyAt + AUTO_SAVE_MAX_INTERVAL_MS;
    const dueAt = Math.min(debounceAt, maxIntervalAt);
    return { status: "scheduled", delayMs: Math.max(0, dueAt - now) };
  },

  /**
   * 保存期限が来ていれば最新内容を書き込む。
   *
   * @param autoSave 書き込み前の自動保存状態。
   * @param operations ファイル書き込みと時刻取得を行う外部操作。
   * @returns 書き込み後の自動保存状態。期限前なら元の状態。
   */
  async saveIfDue(
    autoSave: AutoSave,
    operations: AutoSaveOperations,
  ): Promise<AutoSave> {
    const due = AutoSave.due(autoSave, operations.now());
    if (due.status === "notScheduled" || due.delayMs > 0) {
      return autoSave;
    }
    return save(autoSave, operations);
  },

  /**
   * 待ち時間とトランザクションを無視して、未保存変更があれば即時に書き込む。
   *
   * @param autoSave 書き込み前の自動保存状態。
   * @param operations ファイル書き込みと時刻取得を行う外部操作。
   * @returns 書き込み後の自動保存状態。未保存変更がなければ元の状態。
   */
  async flush(
    autoSave: AutoSave,
    operations: AutoSaveOperations,
  ): Promise<AutoSave> {
    if (!AutoSave.isDirty(autoSave)) {
      return autoSave;
    }
    return save(autoSave, operations);
  },

  /**
   * 未保存内容の書き込みを開始し、saving 状態へ移す。
   *
   * @param autoSave 書き込み前の自動保存状態。
   * @returns 書き込み中の状態。書き込むものがなければ元の状態。
   */
  startSaving(autoSave: AutoSave): AutoSave {
    if (autoSave.status === "idle") {
      return autoSave;
    }
    if (
      autoSave.status === "saving" &&
      autoSave.pendingContents === autoSave.writingContents
    ) {
      return autoSave;
    }
    return toSaving(autoSave, pendingContentsOf(autoSave));
  },

  /**
   * 書き込み結果を、保存中に進んだ現在の状態へ反映する。
   *
   * @param autoSave 書き込み完了時点の自動保存状態。
   * @param outcome 書き込んだ内容とその結果。
   * @returns 成功して差分が無ければ idle、残差があれば pending、失敗なら failed。
   */
  finishSaving(autoSave: AutoSave, outcome: AutoSaveWriteOutcome): AutoSave {
    if (autoSave.status !== "saving") {
      return autoSave;
    }
    return applyWriteOutcome(autoSave, outcome);
  },

  /**
   * ファイルへまだ書き込まれていない内容があるか判定する。
   *
   * @param autoSave 判定する自動保存状態。
   * @returns 未保存変更があるとき true。
   */
  isDirty(autoSave: AutoSave): boolean {
    return pendingContentsOf(autoSave) !== autoSave.lastSavedContents;
  },
} as const;

/**
 * 未保存の最新内容をファイルへ書き込み、結果を状態へ反映する。
 *
 * @param autoSave 書き込み前の自動保存状態。
 * @param operations ファイル書き込みと時刻取得を行う外部操作。
 * @returns 書き込み後の自動保存状態。
 */
const save = async (
  autoSave: AutoSave,
  operations: AutoSaveOperations,
): Promise<AutoSave> => {
  const saving = AutoSave.startSaving(autoSave);
  if (saving.status !== "saving") {
    return autoSave;
  }
  if (
    autoSave.status === "saving" &&
    autoSave.pendingContents === autoSave.writingContents
  ) {
    return autoSave;
  }

  const result = await operations.writeFile(autoSave.path, saving.writingContents);
  return AutoSave.finishSaving(saving, {
    contents: saving.writingContents,
    result,
  });
};

/**
 * 書き込み結果を自動保存状態へ反映する。
 *
 * @param autoSave 書き込み中の自動保存状態。
 * @param outcome 書き込んだ内容とその結果。
 * @returns 成功して差分が無ければ idle、残差があれば pending、失敗なら failed。
 */
const applyWriteOutcome = (
  autoSave: SavingAutoSave,
  outcome: AutoSaveWriteOutcome,
): AutoSave => {
  if (outcome.result.type === "err") {
    return {
      status: "failed",
      path: autoSave.path,
      lastSavedContents: autoSave.lastSavedContents,
      pendingContents: autoSave.pendingContents,
      lastChangedAt: autoSave.lastChangedAt,
      firstDirtyAt: autoSave.firstDirtyAt,
      transactionDepth: autoSave.transactionDepth,
      error: outcome.result.error,
    };
  }

  if (autoSave.pendingContents === outcome.contents) {
    return toIdle(autoSave, outcome.contents);
  }

  return toPending(
    { ...autoSave, lastSavedContents: outcome.contents },
    autoSave.pendingContents,
    autoSave.lastChangedAt,
    autoSave.firstDirtyAt,
  );
};

/**
 * 保存済み内容と同じ文書へ戻した idle 状態を返す。
 *
 * @param autoSave 元の自動保存状態。
 * @param lastSavedContents ファイルへ保存済みの内容。
 * @returns idle 状態。
 */
const toIdle = (
  autoSave: AutoSave,
  lastSavedContents: string,
): IdleAutoSave => ({
  status: "idle",
  path: autoSave.path,
  lastSavedContents,
  transactionDepth: autoSave.transactionDepth,
});

/**
 * 未保存変更を持つ pending 状態を返す。
 *
 * @param autoSave 元の自動保存状態。
 * @param pendingContents まだ書き込んでいない文書内容。
 * @param lastChangedAt 最後に内容が変わった時刻。
 * @param firstDirtyAt 今回の未保存区間が始まった時刻。
 * @returns pending 状態。
 */
const toPending = (
  autoSave: AutoSave,
  pendingContents: string,
  lastChangedAt: number,
  firstDirtyAt: number,
): PendingAutoSave => ({
  status: "pending",
  path: autoSave.path,
  lastSavedContents: autoSave.lastSavedContents,
  pendingContents,
  lastChangedAt,
  firstDirtyAt,
  transactionDepth: autoSave.transactionDepth,
});

/**
 * 指定内容を書き込み中の saving 状態を返す。
 *
 * @param autoSave 元の自動保存状態。
 * @param writingContents これから書き込む内容。
 * @returns saving 状態。
 */
const toSaving = (
  autoSave: Exclude<AutoSave, IdleAutoSave>,
  writingContents: string,
): SavingAutoSave => ({
  status: "saving",
  path: autoSave.path,
  lastSavedContents: autoSave.lastSavedContents,
  pendingContents: pendingContentsOf(autoSave),
  writingContents,
  lastChangedAt: autoSave.lastChangedAt,
  firstDirtyAt: autoSave.firstDirtyAt,
  transactionDepth: autoSave.transactionDepth,
});

/**
 * 未保存内容と最後の変更時刻を更新する。
 *
 * @param autoSave 未保存変更がある自動保存状態。
 * @param pendingContents まだ書き込んでいない文書内容。
 * @param lastChangedAt 最後に内容が変わった時刻。
 * @returns 更新後の状態。
 */
const withPendingContents = (
  autoSave: Exclude<AutoSave, IdleAutoSave>,
  pendingContents: string,
  lastChangedAt: number,
): AutoSave => {
  if (autoSave.status === "failed") {
    return toPending(
      autoSave,
      pendingContents,
      lastChangedAt,
      autoSave.firstDirtyAt,
    );
  }
  if (
    autoSave.status === "saving" &&
    autoSave.pendingContents === autoSave.writingContents &&
    pendingContents !== autoSave.writingContents
  ) {
    return {
      ...autoSave,
      pendingContents,
      lastChangedAt,
      firstDirtyAt: lastChangedAt,
    };
  }
  return { ...autoSave, pendingContents, lastChangedAt };
};

/**
 * トランザクション深度だけを入れ替えた状態を返す。
 *
 * @param autoSave 元の自動保存状態。
 * @param transactionDepth 入れ替える深度。
 * @returns 深度だけが異なる状態。
 */
const withTransactionDepth = (
  autoSave: AutoSave,
  transactionDepth: number,
): AutoSave => ({ ...autoSave, transactionDepth });

/**
 * まだファイルへ書いていない文書内容を返す。
 *
 * @param autoSave 対象の自動保存状態。
 * @returns idle なら保存済み内容、それ以外なら pendingContents。
 */
const pendingContentsOf = (autoSave: AutoSave): string =>
  autoSave.status === "idle" ? autoSave.lastSavedContents : autoSave.pendingContents;
