import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AutoSave, type AutoSaveOperations } from "./autoSave";

/** Context 経由で公開する、1文書の自動保存操作。 */
export type AutoSaveContextValue = Readonly<{
  autoSave: AutoSave;
  notifyContentsChanged: (contents: string) => void;
  beginTransaction: () => void;
  endTransaction: () => void;
  flush: () => Promise<void>;
}>;

const AutoSaveContext = createContext<AutoSaveContextValue | undefined>(
  undefined,
);

type AutoSaveProviderProps = Readonly<{
  path: string;
  initialContents: string;
  operations: AutoSaveOperations;
  children: ReactNode;
}>;

/**
 * 1文書の自動保存状態を保持し、期限が来たら書き込む。
 * path が変わったときは状態と書き込みキューを新しい文書向けに作り直し、
 * 進行中の書き込み結果は新しい文書へ反映しない。
 *
 * @param props 対象パス、初期内容、書き込み操作、子要素。
 * @returns 自動保存操作を下位へ渡す Provider。
 */
export function AutoSaveProvider({
  path,
  initialContents,
  operations,
  children,
}: AutoSaveProviderProps) {
  const [autoSave, setAutoSave] = useState(() =>
    AutoSave.create(path, initialContents),
  );
  const autoSaveRef = useRef(autoSave);
  const operationsRef = useRef(operations);
  const writeQueueRef = useRef(Promise.resolve());
  const openedDocumentRef = useRef({ path, generation: 0 });
  operationsRef.current = operations;

  if (openedDocumentRef.current.path !== path) {
    openedDocumentRef.current = {
      path,
      generation: openedDocumentRef.current.generation + 1,
    };
    writeQueueRef.current = Promise.resolve();
  }

  const openedAutoSave =
    autoSave.path === path
      ? autoSave
      : AutoSave.create(path, initialContents);
  if (autoSave.path !== path) {
    setAutoSave(openedAutoSave);
  }
  autoSaveRef.current = openedAutoSave;

  const replaceAutoSave = (
    next: AutoSave | ((current: AutoSave) => AutoSave),
  ): void => {
    const current = autoSaveRef.current;
    const resolved = typeof next === "function" ? next(current) : next;
    autoSaveRef.current = resolved;
    setAutoSave(resolved);
  };

  const runSave = async (force: boolean): Promise<void> => {
    const generation = openedDocumentRef.current.generation;
    const run = async (): Promise<void> => {
      if (openedDocumentRef.current.generation !== generation) {
        return;
      }

      const current = autoSaveRef.current;
      if (force) {
        if (!AutoSave.isDirty(current)) {
          return;
        }
      } else {
        const due = AutoSave.due(current, operationsRef.current.now());
        if (due.status === "notScheduled" || due.delayMs > 0) {
          return;
        }
      }

      const saving = AutoSave.startSaving(current);
      if (saving.status !== "saving") {
        return;
      }
      if (
        current.status === "saving" &&
        current.pendingContents === current.writingContents
      ) {
        return;
      }

      replaceAutoSave(saving);
      const result = await operationsRef.current.writeFile(
        saving.path,
        saving.writingContents,
      );
      if (openedDocumentRef.current.generation !== generation) {
        return;
      }
      replaceAutoSave((latest) =>
        AutoSave.finishSaving(latest, {
          contents: saving.writingContents,
          result,
        }),
      );
    };

    const queued = writeQueueRef.current.then(run, run);
    writeQueueRef.current = queued.then(
      () => undefined,
      () => undefined,
    );
    await queued;
  };

  useEffect(() => {
    const due = AutoSave.due(openedAutoSave, operationsRef.current.now());
    if (due.status === "notScheduled") {
      return;
    }

    const timer = setTimeout(() => {
      void runSave(false).then(
        () => undefined,
        () => undefined,
      );
    }, due.delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [openedAutoSave]);

  const value = useMemo((): AutoSaveContextValue => {
    return {
      autoSave: openedAutoSave,
      notifyContentsChanged: (contents) => {
        replaceAutoSave((current) =>
          AutoSave.notifyContentsChanged(
            current,
            contents,
            operationsRef.current.now(),
          ),
        );
      },
      beginTransaction: () => {
        replaceAutoSave(AutoSave.beginTransaction);
      },
      endTransaction: () => {
        replaceAutoSave(AutoSave.endTransaction);
      },
      flush: async () => {
        await runSave(true);
      },
    };
  }, [openedAutoSave]);

  return (
    <AutoSaveContext.Provider value={value}>{children}</AutoSaveContext.Provider>
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
