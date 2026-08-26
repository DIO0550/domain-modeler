import { useReducer } from "react";
import { MenuState, type MenuCommandId } from "../menu";
import { TabsState } from "../tabs";

/** AppShell のタブ状態とメニュー操作。 */
export type UseAppShellResult = Readonly<{
  tabsState: TabsState;
  menuState: MenuState;
  activate: (path: string) => void;
  runCommand: (commandId: MenuCommandId) => void;
}>;

/**
 * タブ状態と、そこから導出したメニュー有効状態・操作を返す。
 *
 * @returns タブ状態、メニュー状態、タブ選択、メニューコマンド実行。
 */
export function useAppShell(): UseAppShellResult {
  const [tabsState, dispatch] = useReducer(
    TabsState.reducer,
    TabsState.create(),
  );
  const menuState = MenuState.from(tabsState);

  const activate = (path: string): void => {
    dispatch({ type: "activateTab", path });
  };

  const runCommand = (commandId: MenuCommandId): void => {
    if (commandId !== "closeTab") {
      return;
    }
    if (tabsState.status !== "active") {
      return;
    }
    dispatch({ type: "closeTab", path: tabsState.activePath });
  };

  return { tabsState, menuState, activate, runCommand };
}
