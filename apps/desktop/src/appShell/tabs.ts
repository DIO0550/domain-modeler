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

/** 同名タブを区別するために添える親ディレクトリ。パスは変換しない。 */
export type ParentDirectorySupplement =
  | Readonly<{ status: "hidden" }>
  | Readonly<{ status: "visible"; directory: string }>;

/** タブに表示するファイル名と、必要なときの親ディレクトリ補足。 */
export type TabCaption = Readonly<{
  path: string;
  fileName: string;
  parentDirectorySupplement: ParentDirectorySupplement;
}>;

/** タブが前面か背景か。 */
export type TabActivation = "active" | "background";

/** 表示に必要なタブ本体・キャプション・前面/背景。 */
export type TabView = Readonly<{
  tab: Tab;
  caption: TabCaption;
  activation: TabActivation;
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
  | Readonly<{ type: "closeTab"; path: string }>
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

    if (action.type === "closeTab") {
      return closeTab(state, action.path);
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

  /**
   * 各タブの表示名を返す。同名のときは区別に必要な親ディレクトリを添える。
   *
   * @param state キャプションを求めるタブ状態。
   * @returns タブ順のキャプション。
   */
  captions(state: TabsState): readonly TabCaption[] {
    return TabsState.tabViews(state).map((view) => view.caption);
  },

  /**
   * タブバーに並べる表示用のタブ一覧を返す。
   *
   * @param state 表示するタブ状態。
   * @returns タブ順の表示項目。
   */
  tabViews(state: TabsState): readonly TabView[] {
    return state.tabs.map((tab) => ({
      tab,
      caption: {
        path: tab.path,
        fileName: fileNameOf(tab.path),
        parentDirectorySupplement: parentDirectorySupplementOf(tab, state.tabs),
      },
      activation:
        state.status === "active" && state.activePath === tab.path
          ? "active"
          : "background",
    }));
  },

  /**
   * アクティブなタブを返す。
   *
   * @param state アクティブタブを持つタブ状態。
   * @returns activePath に対応するタブ。見つからなければ先頭のタブ。
   */
  activeTab(state: Extract<TabsState, { status: "active" }>): Tab {
    const found = state.tabs.find((tab) => tab.path === state.activePath);
    if (found !== undefined) {
      return found;
    }
    return state.tabs[0];
  },
} as const;

/**
 * 指定パスのタブを閉じる。最後の1つなら空状態にする。
 *
 * @param state タブがある状態。
 * @param path 閉じるタブのパス。
 * @returns タブを除いたあとの状態。
 */
const closeTab = (
  state: Extract<TabsState, { status: "active" }>,
  path: string,
): TabsState => {
  const index = state.tabs.findIndex((tab) => tab.path === path);
  if (index < 0) {
    return state;
  }

  const remaining = state.tabs.filter((tab) => tab.path !== path);
  if (remaining.length === 0) {
    return { status: "empty", tabs: [] };
  }

  return {
    status: "active",
    tabs: remaining as [Tab, ...Tab[]],
    activePath: nextActivePathAfterClose(state, path, remaining, index),
  };
};

/**
 * タブを閉じたあとに前面にするパスを返す。
 *
 * @param state 閉じる前のタブ状態。
 * @param closedPath 閉じるタブのパス。
 * @param remaining 残ったタブ。1つ以上あること。
 * @param closedIndex 閉じるタブの元の位置。
 * @returns 前面にするパス。
 */
const nextActivePathAfterClose = (
  state: Extract<TabsState, { status: "active" }>,
  closedPath: string,
  remaining: readonly Tab[],
  closedIndex: number,
): string => {
  if (state.activePath !== closedPath) {
    return state.activePath;
  }
  const neighborIndex = Math.min(closedIndex, remaining.length - 1);
  const neighbor = remaining[neighborIndex];
  if (neighbor === undefined) {
    return remaining[0].path;
  }
  return neighbor.path;
};

const WINDOWS_SEPARATOR = "\\";
const POSIX_SEPARATOR = "/";

/**
 * パスからファイル名を取り出す。区切り文字は変換しない。
 *
 * @param path タブのファイルパス。
 * @returns 末尾のセグメント。セグメントが無ければ path そのもの。
 */
const fileNameOf = (path: string): string => {
  const segments = pathSegments(path);
  const last = segments[segments.length - 1];
  if (last === undefined) {
    return path;
  }
  return last;
};

/**
 * パスの親ディレクトリセグメントをファイル名を除いて返す。
 *
 * @param path タブのファイルパス。
 * @returns ルートに近い順のディレクトリ名。
 */
const directorySegmentsOf = (path: string): readonly string[] => {
  const segments = pathSegments(path);
  if (segments.length <= 1) {
    return [];
  }
  return segments.slice(0, -1);
};

/**
 * パスを区切り文字で分割し、空セグメントを除く。
 *
 * @param path タブのファイルパス。
 * @returns 空でないパスセグメント。
 */
const pathSegments = (path: string): readonly string[] =>
  path.split(pathSeparator(path)).filter((segment) => segment.length > 0);

/**
 * パスで使われている区切り文字を返す。混在時は POSIX の区切りを使う。
 *
 * @param path タブのファイルパス。
 * @returns パスの区切り文字。
 */
const pathSeparator = (path: string): typeof WINDOWS_SEPARATOR | typeof POSIX_SEPARATOR => {
  if (path.includes(WINDOWS_SEPARATOR) && !path.includes(POSIX_SEPARATOR)) {
    return WINDOWS_SEPARATOR;
  }
  return POSIX_SEPARATOR;
};

/**
 * 同名タブを区別するために添える親ディレクトリを決める。
 *
 * @param tab 対象のタブ。
 * @param tabs 開いているタブ一覧。
 * @returns 不要なら hidden、必要なら未変換のディレクトリ。
 */
const parentDirectorySupplementOf = (
  tab: Tab,
  tabs: readonly Tab[],
): ParentDirectorySupplement => {
  const fileName = fileNameOf(tab.path);
  const colliding = tabs.filter(
    (candidate) => fileNameOf(candidate.path) === fileName,
  );
  if (colliding.length <= 1) {
    return { status: "hidden" };
  }

  const maxDepth = colliding.reduce(
    (currentMax, candidate) =>
      Math.max(currentMax, directorySegmentsOf(candidate.path).length),
    0,
  );
  const depth = distinguishingDepth(colliding, maxDepth);
  const segments = directorySegmentsOf(tab.path);
  const shown = segments.slice(Math.max(0, segments.length - depth));
  if (shown.length === 0) {
    return { status: "hidden" };
  }
  return {
    status: "visible",
    directory: shown.join(pathSeparator(tab.path)),
  };
};

/**
 * 衝突しているタブの親ディレクトリを一意にできる最短の深さ。
 *
 * @param colliding 同じファイル名のタブ。
 * @param maxDepth 最も深い親ディレクトリの段数。
 * @returns 区別できる深さ。区別できなければ maxDepth。
 */
const distinguishingDepth = (
  colliding: readonly Tab[],
  maxDepth: number,
): number => {
  const depths = Array.from({ length: maxDepth }, (_, index) => index + 1);
  const found = depths.find((depth) => areSuffixesUnique(colliding, depth));
  if (found === undefined) {
    return maxDepth;
  }
  return found;
};

/**
 * 指定深さの親ディレクトリ接尾辞がすべて異なるか判定する。
 *
 * @param colliding 同じファイル名のタブ。
 * @param depth 末尾から取るディレクトリの段数。
 * @returns すべて異なるとき true。
 */
const areSuffixesUnique = (colliding: readonly Tab[], depth: number): boolean => {
  const suffixes = colliding.map((tab) => directorySuffix(tab.path, depth));
  return new Set(suffixes).size === suffixes.length;
};

/**
 * 親ディレクトリの末尾 depth 段を、元の区切り文字で結合して返す。
 *
 * @param path タブのファイルパス。
 * @param depth 末尾から取るディレクトリの段数。
 * @returns 結合したディレクトリ。親が無ければ空文字。
 */
const directorySuffix = (path: string, depth: number): string => {
  const segments = directorySegmentsOf(path);
  const shown = segments.slice(Math.max(0, segments.length - depth));
  return shown.join(pathSeparator(path));
};
