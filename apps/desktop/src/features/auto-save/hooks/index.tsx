import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { writeFileAsResult } from "@/libs/file-write";
import { AutoSave, type AutoSaveOperations } from "../domains";

/** Context 経由で公開する、1文書の自動保存操作。 */
export type AutoSaveContextValue = Readonly<{
  autoSave: AutoSave;
  attachFile: (file: Readonly<{ path: string; contents: string }>) => void;
  notifyContentsChanged: (contents: string) => void;
  acceptExternalContents: (contents: string) => void;
  pause: () => void;
  resume: () => void;
  waitForPendingWrites: () => Promise<AutoSave>;
  beginTransaction: () => void;
  endTransaction: () => void;
  flush: () => Promise<boolean>;
  overwrite: (contents: string) => Promise<boolean>;
}>;

const AutoSaveContext = createContext<AutoSaveContextValue | undefined>(
  undefined,
);

/**
 * 呼び出し側から渡された書き込み操作を、例外も失敗結果として返す形へ包む。
 * domains へは throw しない操作だけを渡す(例外変換は libs 境界の責務)。
 *
 * @param operations 呼び出し側が差し込んだ自動保存操作。
 * @returns writeFile が必ず FileWriteResult を返す自動保存操作。
 */
const asResultOperations = (
  operations: AutoSaveOperations,
): AutoSaveOperations => ({
  ...operations,
  writeFile: (path, contents) =>
    writeFileAsResult(operations.writeFile, { path, contents }),
});

type AutoSaveProviderProps = Readonly<{
  path: string | Readonly<{ draftId: string }>;
  sessionKey?: string;
  initialContents: string;
  operations: AutoSaveOperations;
  children: ReactNode;
}>;

/**
 * 1文書の自動保存状態を保持し、期限が来たら書き込む。
 * 別文書への切り替えではセッションを作り直す。初回保存では同じ sessionKey を維持し、
 * attachFile で編集内容と履歴を保持したまま保存先へ接続する。
 *
 * @param props 対象パス、初期内容、書き込み操作、子要素。
 * @returns 自動保存操作を下位へ渡す Provider。
 */
export function AutoSaveProvider(props: AutoSaveProviderProps) {
  return (
    <AutoSaveSession
      key={
        props.sessionKey ??
        (typeof props.path === "string" ? props.path : props.path.draftId)
      }
      {...props}
    />
  );
}

/**
 * 1つの path に紐づく自動保存セッション。
 *
 * @param props 対象パス、初期内容、書き込み操作、子要素。
 * @returns 自動保存操作を下位へ渡す Provider。
 */
function AutoSaveSession({
  path,
  initialContents,
  operations,
  children,
}: AutoSaveProviderProps) {
  const [autoSave, setAutoSave] = useState(() =>
    AutoSave.create(path, initialContents),
  );
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const autoSaveRef = useRef(autoSave);
  const operationsRef = useRef(asResultOperations(operations));
  const writeQueueRef = useRef(Promise.resolve());
  const sessionMountedRef = useRef(true);
  autoSaveRef.current = autoSave;
  operationsRef.current = asResultOperations(operations);

  useEffect(() => {
    sessionMountedRef.current = true;
    return () => {
      sessionMountedRef.current = false;
    };
  }, []);

  const replaceAutoSave = (
    next: AutoSave | ((current: AutoSave) => AutoSave),
  ): void => {
    const current = autoSaveRef.current;
    const resolved = typeof next === "function" ? next(current) : next;
    autoSaveRef.current = resolved;
    if (!sessionMountedRef.current) {
      return;
    }
    setAutoSave(resolved);
  };

  const runSave = async (force: boolean): Promise<boolean> => {
    const run = async (): Promise<boolean> => {
      if (pausedRef.current) {
        return false;
      }
      const current = autoSaveRef.current;
      if (force) {
        if (!AutoSave.isDirty(current)) {
          return true;
        }
      } else {
        const due = AutoSave.due(current, operationsRef.current.now());
        if (due.status === "notScheduled" || due.delayMs > 0) {
          return true;
        }
      }

      const saving = AutoSave.startSaving(current);
      if (saving.status !== "saving") {
        return true;
      }
      if (
        current.status === "saving" &&
        current.pendingContents === current.writingContents
      ) {
        return true;
      }

      replaceAutoSave(saving);
      const result = await operationsRef.current.writeFile(
        saving.path,
        saving.writingContents,
      );
      replaceAutoSave((latest) =>
        AutoSave.finishSaving(latest, {
          contents: saving.writingContents,
          result,
          now: operationsRef.current.now(),
        }),
      );
      return result.type === "ok";
    };

    const queued = writeQueueRef.current.then(run, run);
    writeQueueRef.current = queued.then(
      () => undefined,
      () => undefined,
    );
    return await queued;
  };

  useEffect(() => {
    if (paused) {
      return;
    }
    const due = AutoSave.due(autoSave, operationsRef.current.now());
    if (due.status === "notScheduled") {
      return;
    }

    const timer = setTimeout(() => {
      void runSave(false).then(
        () => undefined,
        () => undefined,
      );
    }, Math.ceil(due.delayMs));

    return () => {
      clearTimeout(timer);
    };
  }, [autoSave, paused]);

  const value = useMemo((): AutoSaveContextValue => {
    return {
      autoSave,
      attachFile: (file) => {
        replaceAutoSave((current) =>
          AutoSave.attachFile(current, file, operationsRef.current.now()),
        );
      },
      notifyContentsChanged: (contents) => {
        replaceAutoSave((current) =>
          AutoSave.notifyContentsChanged(
            current,
            contents,
            operationsRef.current.now(),
          ),
        );
      },
      acceptExternalContents: (contents) => {
        pausedRef.current = false;
        setPaused(false);
        replaceAutoSave(AutoSave.create(path, contents));
      },
      pause: () => {
        pausedRef.current = true;
        setPaused(true);
      },
      resume: () => {
        pausedRef.current = false;
        setPaused(false);
      },
      waitForPendingWrites: async () => {
        await writeQueueRef.current;
        return autoSaveRef.current;
      },
      beginTransaction: () => {
        replaceAutoSave(AutoSave.beginTransaction);
      },
      endTransaction: () => {
        replaceAutoSave(AutoSave.endTransaction);
      },
      flush: async () => {
        if (autoSaveRef.current.status === "unsaved") {
          return false;
        }
        while (AutoSave.isDirty(autoSaveRef.current)) {
          if (!(await runSave(true))) {
            return false;
          }
        }
        return true;
      },
      overwrite: async (contents) => {
        const run = async (): Promise<boolean> => {
          const current = autoSaveRef.current;
          if (current.status === "unsaved") {
            return false;
          }
          const path = current.path;
          const result = await operationsRef.current.writeFile(path, contents);
          if (result.type !== "ok") {
            return false;
          }
          pausedRef.current = false;
          setPaused(false);
          const latest = autoSaveRef.current;
          const latestContents =
            latest.status === "idle"
              ? latest.lastSavedContents
              : latest.pendingContents;
          let reconciled = AutoSave.create(path, contents);
          for (let depth = 0; depth < latest.transactionDepth; depth += 1) {
            reconciled = AutoSave.beginTransaction(reconciled);
          }
          if (latestContents !== contents) {
            reconciled = AutoSave.notifyContentsChanged(
              reconciled,
              latestContents,
              operationsRef.current.now(),
            );
          }
          replaceAutoSave(reconciled);
          return true;
        };
        const queued = writeQueueRef.current.then(run, run);
        writeQueueRef.current = queued.then(
          () => undefined,
          () => undefined,
        );
        return await queued;
      },
    };
  }, [autoSave]);

  return (
    <AutoSaveContext.Provider value={value}>
      {children}
    </AutoSaveContext.Provider>
  );
}

/**
 * 現在の文書の自動保存操作を返す。
 *
 * @returns Provider 配下なら操作。外なら undefined。
 */
export function useAutoSave(): AutoSaveContextValue | undefined {
  return useContext(AutoSaveContext);
}
