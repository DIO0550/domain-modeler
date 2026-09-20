import { useCallback, useEffect, useRef } from "react";
import { DocumentWorkspace } from "./appShell/document-workspace";
import { useAppShell } from "./appShell/hooks";
import { MenuBar } from "./appShell/menu-bar";
import { TabBar } from "./appShell/tab-bar";
import {
  isAppWindowAvailable,
  listenCloseRequested,
} from "./libs/app-window";
import { FILE_WATCH_OPERATIONS } from "./libs/file-watch";
import "./App.css";

function App() {
  const manualSaves = useRef(new Map<string, () => Promise<boolean>>());
  const saveSessions = useRef(new Map<string, () => Promise<boolean>>());
  const {
    tabsState,
    menuState,
    activate,
    runCommand,
    dispatchExternalFileAction,
  } = useAppShell({
    saveDocument: async (path) =>
      await (manualSaves.current.get(path)?.() ?? Promise.resolve(false)),
    flushDocument: async (path) =>
      await flushStableSaveSession(saveSessions.current, path),
  });
  const registerSaveSession = useCallback(
    (path: string, flush: () => Promise<boolean>): (() => void) => {
      saveSessions.current.set(path, flush);
      return () => {
        if (saveSessions.current.get(path) === flush) {
          saveSessions.current.delete(path);
        }
      };
    },
    [],
  );

  const registerManualSave = useCallback(
    (path: string, save: () => Promise<boolean>) => {
      manualSaves.current.set(path, save);
      return () => {
        if (manualSaves.current.get(path) === save) {
          manualSaves.current.delete(path);
        }
      };
    },
    [],
  );

  useEffect(() => {
    if (import.meta.env.MODE === "test" || !isAppWindowAvailable()) {
      return;
    }
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void listenCloseRequested(() =>
      flushStableSaveSessions(saveSessions.current),
    ).then((nextUnlisten) => {
      if (disposed) {
        nextUnlisten();
        return;
      }
      unlisten = nextUnlisten;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  return (
    <div className="app-shell">
      <MenuBar menuState={menuState} onCommand={runCommand} />
      <TabBar tabsState={tabsState} onActivate={activate} />
      <DocumentWorkspace
        tabsState={tabsState}
        registerSaveSession={registerSaveSession}
        registerManualSave={registerManualSave}
        fileWatchOperations={
          import.meta.env.MODE === "test" ? undefined : FILE_WATCH_OPERATIONS
        }
        dispatchExternalFileAction={dispatchExternalFileAction}
      />
    </div>
  );
}

/**
 * 保存中の再編集も含め、全セッションが同じ世代で保存済みになるまでflushする。
 *
 * @param sessions パスごとの最新flush操作。
 * @returns 全セッションが同時に保存済みならtrue。保存失敗ならfalse。
 */
export async function flushStableSaveSessions(
  sessions: ReadonlyMap<string, () => Promise<boolean>>,
): Promise<boolean> {
  const verified = new Map<string, () => Promise<boolean>>();
  while (true) {
    const snapshot = [...sessions.entries()];
    for (const [path, flush] of snapshot) {
      if (verified.get(path) === flush) {
        continue;
      }
      if (!(await flush())) {
        return false;
      }
      verified.set(path, flush);
    }
    const isStable =
      snapshot.length === sessions.size &&
      snapshot.every(([path, flush]) => sessions.get(path) === flush);
    if (isStable) {
      return true;
    }
  }
}

/**
 * タブを閉じる間に登録された新しい保存世代も完了するまでflushする。
 *
 * @param sessions パスごとの最新flush操作。
 * @param path 閉じる文書のパス。
 * @returns 最新世代まで保存できた場合はtrue。
 */
export async function flushStableSaveSession(
  sessions: ReadonlyMap<string, () => Promise<boolean>>,
  path: string,
): Promise<boolean> {
  while (true) {
    const flush = sessions.get(path);
    if (flush === undefined) {
      return true;
    }
    if (!(await flush())) {
      return false;
    }
    if (sessions.get(path) === flush) {
      return true;
    }
  }
}

export default App;
