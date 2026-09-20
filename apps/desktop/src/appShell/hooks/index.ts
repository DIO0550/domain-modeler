import { useReducer } from "react";
import { MenuState, type MenuCommandId } from "../menu";
import { TabsState, type TabsAction } from "../tabs";

/** AppShell のタブ状態とメニュー操作。 */
export type UseAppShellResult = Readonly<{
  tabsState: TabsState;
  menuState: MenuState;
  activate: (path: string) => void;
  runCommand: (commandId: MenuCommandId) => Promise<void>;
  dispatchExternalFileAction: (
    action: Extract<
      TabsAction,
      {
        type:
          | "savedTab"
          | "markFileMissing"
          | "clearFileMissing"
          | "markBackgroundChanged";
      }
    >,
  ) => void;
}>;

export type AppShellOperations = Readonly<{
  saveDocument?: (path: string) => Promise<boolean>;
  flushDocument: (path: string) => Promise<boolean>;
}>;

const DEFAULT_OPERATIONS: AppShellOperations = {
  flushDocument: async () => true,
};

/**
 * タブ状態と、そこから導出したメニュー有効状態・操作を返す。
 *
 * @returns タブ状態、メニュー状態、タブ選択、メニューコマンド実行。
 */
export function useAppShell(
  operations: AppShellOperations = DEFAULT_OPERATIONS,
): UseAppShellResult {
  const [tabsState, dispatch] = useReducer(
    TabsState.reducer,
    TabsState.create(),
  );
  const menuState = MenuState.from(tabsState);

  const activate = (path: string): void => {
    dispatch({ type: "activateTab", path });
  };

  const runCommand = async (commandId: MenuCommandId): Promise<void> => {
    if (commandId === "newCanvas" || commandId === "newModel") {
      dispatch({
        type: "newTab",
        documentType: commandId === "newCanvas" ? "canvas" : "model",
      });
      return;
    }
    if (commandId === "save" && tabsState.status === "active") {
      await operations.saveDocument?.(tabsState.activePath);
      return;
    }
    if (commandId !== "closeTab") {
      return;
    }
    if (tabsState.status !== "active") {
      return;
    }
    if (!(await operations.flushDocument(tabsState.activePath))) {
      return;
    }
    dispatch({ type: "closeTab", path: tabsState.activePath });
  };

  const dispatchExternalFileAction: UseAppShellResult["dispatchExternalFileAction"] =
    (action) => {
      dispatch(action);
    };

  return {
    tabsState,
    menuState,
    activate,
    runCommand,
    dispatchExternalFileAction,
  };
}
