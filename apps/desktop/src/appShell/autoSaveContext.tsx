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
  autoSaveRef.current = autoSave;
  operationsRef.current = operations;

  const runSave = async (startedFrom: AutoSave): Promise<void> => {
    const saving = AutoSave.startSaving(startedFrom);
    if (saving.status !== "saving") {
      return;
    }
    setAutoSave(saving);
    const result = await operationsRef.current.writeFile(
      saving.path,
      saving.writingContents,
    );
    setAutoSave((current) =>
      AutoSave.finishSaving(current, {
        contents: saving.writingContents,
        result,
      }),
    );
  };

  useEffect(() => {
    const due = AutoSave.due(autoSave, operationsRef.current.now());
    if (due.status === "notScheduled") {
      return;
    }

    const timer = setTimeout(() => {
      const current = autoSaveRef.current;
      const remaining = AutoSave.due(current, operationsRef.current.now());
      if (remaining.status === "notScheduled" || remaining.delayMs > 0) {
        return;
      }
      void runSave(current);
    }, due.delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [autoSave]);

  const value = useMemo((): AutoSaveContextValue => {
    return {
      autoSave,
      notifyContentsChanged: (contents) => {
        setAutoSave((current) =>
          AutoSave.notifyContentsChanged(
            current,
            contents,
            operationsRef.current.now(),
          ),
        );
      },
      beginTransaction: () => {
        setAutoSave(AutoSave.beginTransaction);
      },
      endTransaction: () => {
        setAutoSave(AutoSave.endTransaction);
      },
      flush: async () => {
        await runSave(autoSaveRef.current);
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
