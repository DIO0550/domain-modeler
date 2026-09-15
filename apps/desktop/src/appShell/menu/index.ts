import { TabsState } from "../tabs";

/** メニューから起動するコマンド。 */
export type MenuCommandId =
  | "newCanvas"
  | "newModel"
  | "open"
  | "closeTab"
  | "undo"
  | "redo"
  | "generateFromCanvas";

/** メニューコマンドが実行できるかどうか。 */
export type CommandAvailability = "enabled" | "disabled";

/** アクティブ文書に応じたメニューコマンドの有効状態。 */
export type MenuState = Readonly<Record<MenuCommandId, CommandAvailability>>;

/** メニューコマンドの有効状態を扱う関数群。 */
export const MenuState = {
  /**
   * タブ状態からメニューコマンドの有効状態を返す。
   *
   * @param tabsState 開いている文書とアクティブタブ。
   * @param isCreating 新規作成操作が進行中か。
   * @returns コマンドごとの有効 / 無効。
   */
  from(tabsState: TabsState, isCreating = false): MenuState {
    return {
      newCanvas: isCreating ? "disabled" : "enabled",
      newModel: isCreating ? "disabled" : "enabled",
      open: "enabled",
      closeTab: documentCommandAvailability(tabsState),
      undo: documentCommandAvailability(tabsState),
      redo: documentCommandAvailability(tabsState),
      generateFromCanvas: generateAvailability(tabsState),
    };
  },
} as const;

/**
 * 文書が開いているときだけ有効なコマンドの状態を返す。
 *
 * @param tabsState 開いている文書とアクティブタブ。
   * @param isCreating 新規作成操作が進行中か。
 * @returns 文書があるときは enabled、無いときは disabled。
 */
const documentCommandAvailability = (
  tabsState: TabsState,
): CommandAvailability => {
  if (tabsState.status === "empty") {
    return "disabled";
  }
  return "enabled";
};

/**
 * キャンバスからドメインモデルを生成するコマンドの状態を返す。
 *
 * @param tabsState 開いている文書とアクティブタブ。
   * @param isCreating 新規作成操作が進行中か。
 * @returns アクティブタブがキャンバスのときだけ enabled。
 */
const generateAvailability = (tabsState: TabsState): CommandAvailability => {
  if (tabsState.status === "empty") {
    return "disabled";
  }
  const activeTab = TabsState.activeTab(tabsState);
  if (activeTab.documentType === "canvas") {
    return "enabled";
  }
  return "disabled";
};
