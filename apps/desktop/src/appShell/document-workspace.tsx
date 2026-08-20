import { TabsState } from "./tabs";

type DocumentWorkspaceProps = Readonly<{
  tabsState: TabsState;
}>;

/**
 * アクティブ文書のプレースホルダ。キャンバス/モデル画面の置き場所。
 *
 * @param props タブ状態。
 * @returns 文書領域。
 */
export function DocumentWorkspace({ tabsState }: DocumentWorkspaceProps) {
  if (tabsState.status === "empty") {
    return (
      <main className="document-workspace">
        <p className="document-workspace__message">文書が開かれていません</p>
      </main>
    );
  }

  const activeTab = TabsState.activeTab(tabsState);
  const caption = TabsState.captions(tabsState).find(
    (item) => item.path === activeTab.path,
  );
  const fileName = caption === undefined ? activeTab.path : caption.fileName;
  const documentTypeLabel =
    activeTab.documentType === "canvas" ? "キャンバス" : "ドメインモデル";
  const missingBanner =
    activeTab.fileState.status === "missing" ? (
      <p className="document-workspace__banner" role="alert">
        ファイルが見つかりません。編集を続けるとこのパスに再作成されます。
      </p>
    ) : null;

  return (
    <main className="document-workspace">
      {missingBanner}
      <p className="document-workspace__message">
        {documentTypeLabel} · {fileName}
      </p>
    </main>
  );
}
