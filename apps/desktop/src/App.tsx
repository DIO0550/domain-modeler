import { useReducer } from "react";
import { DocumentWorkspace } from "./appShell/document-workspace";
import { TabBar } from "./appShell/tab-bar";
import { TabsState } from "./appShell/tabs";
import "./App.css";

function App() {
  const [tabsState, dispatch] = useReducer(TabsState.reducer, TabsState.create());

  return (
    <div className="app-shell">
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
