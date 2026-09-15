import { useReducer } from "react";
import { selectSavePath } from "@/libs/file-dialog";
import { createFile } from "@/libs/file-write";
import { FileActions, type NewDocumentResult } from "../fileActions";
import { MenuState, type MenuCommandId } from "../menu";
import { TabsState, type TabsAction } from "../tabs";

/** AppShell のタブ状態とメニュー操作。 */
export type UseAppShellResult = Readonly<{
  tabsState: TabsState;
  menuState: MenuState;
  activate: (path: string) => void;
  runCommand: (commandId: MenuCommandId) => Promise<void>;
  creation: Readonly<{ status: "idle" | "creating" }> | NewDocumentResult;
}>;

type AppShellState = Readonly<{
  tabsState: TabsState;
  creation: UseAppShellResult["creation"];
}>;

type AppShellAction = TabsAction | Readonly<{
  type: "setCreation";
  creation: UseAppShellResult["creation"];
}>;

/** タブ操作と新規作成の進行状態を更新する純粋なreducer。 */
const appShellReducer = (state: AppShellState, action: AppShellAction): AppShellState => {
  if (action.type === "setCreation") {
    return { ...state, creation: action.creation };
  }
  return { ...state, tabsState: TabsState.reducer(state.tabsState, action) };
};

/**
 * タブ状態と、そこから導出したメニュー有効状態・操作を返す。
 *
 * @returns タブ状態、メニュー状態、タブ選択、メニューコマンド実行。
 */
export function useAppShell(): UseAppShellResult {
  const [{ tabsState, creation }, dispatch] = useReducer(appShellReducer, {
    tabsState: TabsState.create(),
    creation: { status: "idle" },
  });
  const menuState = MenuState.from(tabsState, creation.status === "creating");

  const activate = (path: string): void => {
    dispatch({ type: "activateTab", path });
  };

  const runCommand = async (commandId: MenuCommandId): Promise<void> => {
    if (commandId === "newCanvas" || commandId === "newModel") {
      if (creation.status === "creating") {
        return;
      }
      dispatch({ type: "setCreation", creation: { status: "creating" } });
      const result = await FileActions.createNewDocument(
        commandId === "newCanvas" ? "canvas" : "model",
        {
          selectSavePath,
          createFile,
          openTab: (path, documentType) => dispatch({ type: "openTab", path, documentType }),
        },
        tabsState.status === "active" ? tabsState.tabs.map((tab) => tab.path) : [],
      );
      dispatch({ type: "setCreation", creation: result });
      return;
    }
    if (commandId !== "closeTab") {
      return;
    }
    if (tabsState.status !== "active") {
      return;
    }
    dispatch({ type: "closeTab", path: tabsState.activePath });
  };

  return { tabsState, menuState, activate, runCommand, creation };
}
