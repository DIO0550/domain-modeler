import { DocumentWorkspace } from "./appShell/document-workspace";
import { useAppShell } from "./appShell/hooks";
import { MenuBar } from "./appShell/menu-bar";
import { TabBar } from "./appShell/tab-bar";
import "./App.css";

function App() {
  const { tabsState, menuState, activate, runCommand, creation } = useAppShell();

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
      <DocumentWorkspace tabsState={tabsState} />
    </div>
  );
}

export default App;
