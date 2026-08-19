/** タブが表示する文書の種別。 */
export type TabDocumentType = "canvas" | "model";

/** タブに対応するファイルの状態。 */
export type TabFileState =
  | Readonly<{ status: "available" }>
  | Readonly<{ status: "missing" }>;

/** 背景タブに取り込まれた変更の表示状態。 */
export type TabBackgroundChangeState =
  | Readonly<{ status: "unchanged" }>
  | Readonly<{ status: "changed" }>;

/** 開いている文書を表すタブ。 */
export type Tab = Readonly<{
  path: string;
  documentType: TabDocumentType;
  fileState: TabFileState;
  backgroundChangeState: TabBackgroundChangeState;
}>;

/** タブが存在しない状態、またはアクティブタブを持つ状態。 */
export type TabsState =
  | Readonly<{
      status: "empty";
      tabs: readonly [];
    }>
  | Readonly<{
      status: "active";
      tabs: readonly [Tab, ...Tab[]];
      activePath: string;
    }>;

/** タブ状態に適用できる操作。 */
export type TabsAction =
  | Readonly<{
      type: "openTab";
      path: string;
      documentType: TabDocumentType;
    }>
  | Readonly<{ type: "activateTab"; path: string }>
  | Readonly<{ type: "markFileMissing"; path: string }>
  | Readonly<{ type: "clearFileMissing"; path: string }>
  | Readonly<{ type: "markBackgroundChanged"; path: string }>;

/** タブ一覧とアクティブタブの状態を扱う関数群。 */
export const TabsState = {
  /**
   * タブが存在しない初期状態を生成する。
   *
   * @returns 新しい初期状態。
   */
  create(): TabsState {
    return { status: "empty", tabs: [] };
  },

  /**
   * タブ状態に操作を適用する。
   *
   * @param state 操作前のタブ状態。
   * @param action 適用する操作。
   * @returns 操作後の新しいタブ状態。
   */
  reducer(state: TabsState, action: TabsAction): TabsState {
    if (action.type === "openTab") {
      const existingTab = state.tabs.find((tab) => tab.path === action.path);
      if (existingTab !== undefined) {
        const tabs = state.tabs.map((tab) =>
          tab.path === action.path
            ? { ...tab, backgroundChangeState: { status: "unchanged" } as const }
            : tab,
        ) as [Tab, ...Tab[]];
        return { status: "active", tabs, activePath: action.path };
      }

      const openedTab: Tab = {
        path: action.path,
        documentType: action.documentType,
        fileState: { status: "available" },
        backgroundChangeState: { status: "unchanged" },
      };
      const tabs = [...state.tabs, openedTab] as [Tab, ...Tab[]];
      return { status: "active", tabs, activePath: action.path };
    }

    if (state.status === "empty") {
      return { status: "empty", tabs: [] };
    }

    if (action.type === "activateTab") {
      const isOpen = state.tabs.some((tab) => tab.path === action.path);
      if (!isOpen) {
        return { ...state, tabs: [...state.tabs] };
      }
      const tabs = state.tabs.map((tab) =>
        tab.path === action.path
          ? { ...tab, backgroundChangeState: { status: "unchanged" } as const }
          : tab,
      ) as [Tab, ...Tab[]];
      return { status: "active", tabs, activePath: action.path };
    }

    const tabs = state.tabs.map((tab): Tab => {
      if (tab.path !== action.path) {
        return tab;
      }
      if (action.type === "markFileMissing") {
        return { ...tab, fileState: { status: "missing" } };
      }
      if (action.type === "clearFileMissing") {
        return { ...tab, fileState: { status: "available" } };
      }
      if (state.activePath === action.path) {
        return tab;
      }
      return { ...tab, backgroundChangeState: { status: "changed" } };
    }) as [Tab, ...Tab[]];
    return { status: "active", tabs, activePath: state.activePath };
  },
} as const;
