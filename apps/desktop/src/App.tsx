import { DocumentWorkspace } from "./appShell/document-workspace";
import { useAppShell } from "./appShell/hooks";
import { MenuBar } from "./appShell/menu-bar";
import { TabBar } from "./appShell/tab-bar";
import "./App.css";

function App() {
  const { tabsState, menuState, activate, runCommand } = useAppShell();

  return (
    <div className="app-shell">
      <MenuBar menuState={menuState} onCommand={runCommand} />
      <TabBar tabsState={tabsState} onActivate={activate} />
      <DocumentWorkspace tabsState={tabsState} />
    </div>
  );
}

export default App;
