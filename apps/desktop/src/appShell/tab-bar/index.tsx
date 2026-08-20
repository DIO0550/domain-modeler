import type { KeyboardEvent } from "react";
import {
  type Tab,
  type TabActivation,
  type TabCaption,
  type TabDocumentType,
  type TabView,
  TabsState,
} from "../tabs";

type TabBarProps = Readonly<{
  tabsState: TabsState;
  onActivate: (path: string) => void;
}>;

type TabBarItemProps = Readonly<{
  view: TabView;
  onActivate: (path: string) => void;
}>;

const DOCUMENT_TYPE_LABEL = {
  canvas: "キャンバス",
  model: "ドメインモデル",
} as const satisfies Record<TabDocumentType, string>;

/**
 * 開いている文書のタブバー。
 *
 * @param props タブ状態と選択ハンドラ。
 * @returns タブリスト。
 */
export function TabBar({ tabsState, onActivate }: TabBarProps) {
  const views = TabsState.tabViews(tabsState);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (tabsState.status !== "active") {
      return;
    }
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const currentIndex = views.findIndex(
      (view) => view.activation === "active",
    );
    const nextIndex =
      (currentIndex + direction + views.length) % views.length;
    const next = views[nextIndex];
    if (next === undefined) {
      return;
    }
    onActivate(next.tab.path);
  };

  return (
    <div
      className="tab-bar"
      role="tablist"
      aria-label="開いている文書"
      onKeyDown={handleKeyDown}
    >
      {views.map((view) => (
        <TabBarItem
          key={view.tab.path}
          view={view}
          onActivate={onActivate}
        />
      ))}
    </div>
  );
}

/**
 * 1つの文書タブ。
 *
 * @param props 表示項目と選択ハンドラ。
 * @returns タブボタン。
 */
function TabBarItem({ view, onActivate }: TabBarItemProps) {
  const { tab, caption, activation } = view;
  const isActive = activation === "active";
  const className = tabBarItemClassName(activation, tab);

  return (
    <button
      type="button"
      role="tab"
      className={className}
      aria-selected={isActive}
      aria-label={tabAccessibleName(tab, caption)}
      title={tab.path}
      tabIndex={0}
      onClick={() => {
        onActivate(tab.path);
      }}
    >
      <DocumentTypeIcon documentType={tab.documentType} />
      <span className="tab-bar__file-name">{caption.fileName}</span>
      <ParentDirectoryLabel caption={caption} />
      <MissingWarningIcon fileState={tab.fileState} />
      <BackgroundChangeMark
        backgroundChangeState={tab.backgroundChangeState}
      />
    </button>
  );
}

type ParentDirectoryLabelProps = Readonly<{
  caption: TabCaption;
}>;

/**
 * 同名タブを区別する親ディレクトリ。不要なときは何も出さない。
 *
 * @param props タブのキャプション。
 * @returns 親ディレクトリの補足、または null。
 */
function ParentDirectoryLabel({ caption }: ParentDirectoryLabelProps) {
  if (caption.parentDirectorySupplement.status !== "visible") {
    return null;
  }
  return (
    <span className="tab-bar__parent">
      {caption.parentDirectorySupplement.directory}
    </span>
  );
}

type MissingWarningIconProps = Readonly<{
  fileState: Tab["fileState"];
}>;

/**
 * ファイル欠損の警告アイコン。欠損していなければ何も出さない。
 *
 * @param props タブのファイル状態。
 * @returns 警告アイコン、または null。
 */
function MissingWarningIcon({ fileState }: MissingWarningIconProps) {
  if (fileState.status !== "missing") {
    return null;
  }
  return (
    <svg
      className="tab-bar__warning"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path
        d="M8 1.5 14.5 13h-13L8 1.5Z"
        fill="currentColor"
      />
      <rect x="7.25" y="6" width="1.5" height="4" fill="#fff" />
      <rect x="7.25" y="11" width="1.5" height="1.5" fill="#fff" />
    </svg>
  );
}

type BackgroundChangeMarkProps = Readonly<{
  backgroundChangeState: Tab["backgroundChangeState"];
}>;

/**
 * 背景タブへの取り込みを示す変更マーク。未変更なら何も出さない。
 *
 * @param props 背景変更状態。
 * @returns 変更ドット、または null。
 */
function BackgroundChangeMark({
  backgroundChangeState,
}: BackgroundChangeMarkProps) {
  if (backgroundChangeState.status !== "changed") {
    return null;
  }
  return <span className="tab-bar__change-mark" aria-hidden="true" />;
}

type DocumentTypeIconProps = Readonly<{
  documentType: TabDocumentType;
}>;

/**
 * 文書種別を表すアイコン。
 *
 * @param props キャンバスまたはモデル。
 * @returns 種別アイコン。
 */
function DocumentTypeIcon({ documentType }: DocumentTypeIconProps) {
  if (documentType === "canvas") {
    return (
      <svg
        className="tab-bar__type-icon"
        viewBox="0 0 16 16"
        width="14"
        height="14"
        aria-hidden="true"
      >
        <rect
          x="2.5"
          y="3.5"
          width="11"
          height="9"
          rx="1.5"
          fill="currentColor"
          opacity="0.85"
        />
        <path
          d="M5 7.5h6M5 10h4"
          stroke="#fff"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      className="tab-bar__type-icon"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path
        d="M4 2.5h5.5L12.5 6v7.5H4v-11Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path d="M9.5 2.5V6H12.5" fill="#fff" opacity="0.35" />
      <path
        d="M6 8.5h4M6 11h3"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * タブボタンの class を組み立てる。
 *
 * @param activation 前面か背景か。
 * @param tab 対象タブ。
 * @returns tab-bar__item と状態修飾。
 */
const tabBarItemClassName = (activation: TabActivation, tab: Tab): string => {
  const activeClass =
    activation === "active" ? ["tab-bar__item--active"] : [];
  const missingClass =
    tab.fileState.status === "missing" ? ["tab-bar__item--missing"] : [];
  const classNames = ["tab-bar__item", ...activeClass, ...missingClass];
  return classNames.join(" ");
};

/**
 * スクリーンリーダー向けのタブ名を組み立てる。
 *
 * @param tab 対象タブ。
 * @param caption ファイル名と親ディレクトリ補足。
 * @returns 種別・ファイル名・補足・警告を含む名前。
 */
const tabAccessibleName = (tab: Tab, caption: TabCaption): string => {
  const parent =
    caption.parentDirectorySupplement.status === "visible"
      ? caption.parentDirectorySupplement.directory
      : "";
  const missing = tab.fileState.status === "missing" ? "ファイル欠損" : "";
  const changed =
    tab.backgroundChangeState.status === "changed" ? "未読の変更" : "";
  const parts = [
    DOCUMENT_TYPE_LABEL[tab.documentType],
    caption.fileName,
    parent,
    missing,
    changed,
  ].filter((part) => part.length > 0);
  return parts.join(" ");
};
