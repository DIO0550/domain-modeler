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
import { writeFileAsResult } from "./fileActions";

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
 * path が変わったときは key によりセッションを作り直し、
 * 進行中の書き込み結果は新しい文書へ反映しない。
 *
 * @param props 対象パス、初期内容、書き込み操作、子要素。
 * @returns 自動保存操作を下位へ渡す Provider。
 */
export function AutoSaveProvider(props: AutoSaveProviderProps) {
  return <AutoSaveSession key={props.path} {...props} />;
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
  const autoSaveRef = useRef(autoSave);
  const operationsRef = useRef(operations);
  const writeQueueRef = useRef(Promise.resolve());
  autoSaveRef.current = autoSave;
  operationsRef.current = operations;

  const replaceAutoSave = (
    next: AutoSave | ((current: AutoSave) => AutoSave),
  ): void => {
    const current = autoSaveRef.current;
    const resolved = typeof next === "function" ? next(current) : next;
    autoSaveRef.current = resolved;
    setAutoSave(resolved);
  };

  const runSave = async (force: boolean): Promise<void> => {
    const run = async (): Promise<void> => {
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
      const result = await writeFileAsResult(operationsRef.current.writeFile, {
        path: saving.path,
        contents: saving.writingContents,
      });
      replaceAutoSave((latest) =>
        AutoSave.finishSaving(latest, {
          contents: saving.writingContents,
          result,
          now: operationsRef.current.now(),
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
    const due = AutoSave.due(autoSave, operationsRef.current.now());
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
  }, [autoSave]);

  const value = useMemo((): AutoSaveContextValue => {
    return {
      autoSave,
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
  }, [autoSave]);

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
