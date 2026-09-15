import { useCallback, useEffect, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { DocumentWorkspace } from "./appShell/document-workspace";
import { useAppShell } from "./appShell/hooks";
import { MenuBar } from "./appShell/menu-bar";
import { TabBar } from "./appShell/tab-bar";
import { FILE_WATCH_OPERATIONS } from "./libs/file-watch";
import "./App.css";

function App() {
  const saveSessions = useRef(new Map<string, () => Promise<boolean>>());
  const {
    tabsState,
    menuState,
    activate,
    runCommand,
    creation,
    dispatchExternalFileAction,
  } = useAppShell({
    flushDocument: async (path) =>
      await (saveSessions.current.get(path)?.() ?? Promise.resolve(true)),
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

  useEffect(() => {
    if (import.meta.env.MODE === "test" || !isTauri()) {
      return;
    }
    const appWindow = getCurrentWindow();
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void appWindow
      .onCloseRequested(async (event) => {
        event.preventDefault();
        const results = await Promise.all(
          [...saveSessions.current.values()].map(async (flush) => await flush()),
        );
        if (results.every(Boolean)) {
          await appWindow.destroy();
        }
      })
      .then((nextUnlisten) => {
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
      {creation.status === "dialogFailed" && (
        <p className="document-workspace__banner" role="alert">保存先を選択できませんでした: {creation.message}</p>
      )}
      {creation.status === "writeFailed" && (
        <p className="document-workspace__banner" role="alert">ファイルを作成できませんでした: {creation.error.message}</p>
      )}
      <TabBar tabsState={tabsState} onActivate={activate} />
      <DocumentWorkspace
        tabsState={tabsState}
        registerSaveSession={registerSaveSession}
        fileWatchOperations={
          import.meta.env.MODE === "test" ? undefined : FILE_WATCH_OPERATIONS
        }
        dispatchExternalFileAction={dispatchExternalFileAction}
      />
    </div>
  );
}

export default App;
