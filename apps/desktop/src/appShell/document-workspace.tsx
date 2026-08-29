import { Viewport } from "@domain-modeler/canvas-core";
import { CanvasEditor } from "@/features/canvas";
import { TabsState } from "./tabs";

type DocumentWorkspaceProps = Readonly<{
  tabsState: TabsState;
}>;

/**
 * アクティブ文書の表示領域。キャンバス文書はキャンバス画面を出す。
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
  const missingBanner =
    activeTab.fileState.status === "missing" ? (
      <p className="document-workspace__banner" role="alert">
        ファイルが見つかりません。編集を続けるとこのパスに再作成されます。
      </p>
    ) : null;

  if (activeTab.documentType === "canvas") {
    return (
      <main className="document-workspace">
        {missingBanner}
        <CanvasEditor
          key={activeTab.path}
          zoom={Viewport.default().zoom}
          saveStatus="saved"
        />
      </main>
    );
  }

  const caption = TabsState.captions(tabsState).find(
    (item) => item.path === activeTab.path,
  );
  const fileName = caption === undefined ? activeTab.path : caption.fileName;

  return (
    <main className="document-workspace">
      {missingBanner}
      <p className="document-workspace__message">ドメインモデル · {fileName}</p>
    </main>
  );
}
