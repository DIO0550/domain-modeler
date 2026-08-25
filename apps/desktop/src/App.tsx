import { useReducer } from "react";
import { DocumentWorkspace } from "./appShell/document-workspace";
import { MenuState, type MenuCommandId } from "./appShell/menu";
import { MenuBar } from "./appShell/menu-bar";
import { TabBar } from "./appShell/tab-bar";
import { TabsState } from "./appShell/tabs";
import "./App.css";

function App() {
  const [tabsState, dispatch] = useReducer(TabsState.reducer, TabsState.create());
  const menuState = MenuState.from(tabsState);

  const handleCommand = (commandId: MenuCommandId): void => {
    if (commandId !== "closeTab") {
      return;
    }
    if (tabsState.status !== "active") {
      return;
    }
    dispatch({ type: "closeTab", path: tabsState.activePath });
  };

  return (
    <div className="app-shell">
      <MenuBar menuState={menuState} onCommand={handleCommand} />
      <TabBar
        tabsState={tabsState}
        onActivate={(path) => {
          dispatch({ type: "activateTab", path });
        }}
      />
      <DocumentWorkspace tabsState={tabsState} />
    </div>
  );
}

export default App;
