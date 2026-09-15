import { useCallback, useRef } from "react";
import { DocumentWorkspace } from "./appShell/document-workspace";
import { useAppShell } from "./appShell/hooks";
import { MenuBar } from "./appShell/menu-bar";
import { TabBar } from "./appShell/tab-bar";
import "./App.css";

function App() {
  const saveSessions = useRef(new Map<string, () => Promise<boolean>>());
  const { tabsState, menuState, activate, runCommand, creation } = useAppShell({
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
      />
    </div>
  );
}

export default App;
