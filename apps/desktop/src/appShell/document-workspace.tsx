import { useState } from "react";
import { ModelEditor } from "@/features/model";
import { CanvasEditor } from "@/features/canvas";
import type { TabsState, Tab } from "./tabs";

type DocumentWorkspaceProps = Readonly<{
  tabsState: TabsState;
}>;

/**
 * 文書種別に対応する編集画面を表示し、背景タブの編集状態も保持する。
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

  return (
    <main className="document-workspace">
      {tabsState.tabs.map((tab) => (
        <section
          key={tab.path}
          className="document-workspace__document"
          hidden={tab.path !== tabsState.activePath}
        >
          <DocumentEditor tab={tab} />
        </section>
      ))}
    </main>
  );
}

/** 文書ごとの編集セッションを保持し、タブ切り替えでも内容を維持する。 */
function DocumentEditor({ tab: activeTab }: Readonly<{ tab: Tab }>) {
  const [text, setText] = useState("");
  const missingBanner =
    activeTab.fileState.status === "missing" ? (
      <p className="document-workspace__banner" role="alert">
        ファイルが見つかりません。編集を続けるとこのパスに再作成されます。
      </p>
    ) : null;

  if (activeTab.documentType === "canvas") {
    return (
      <>
        {missingBanner}
        <CanvasEditor
          key={activeTab.path}
          saveStatus="saved"
        />
      </>
    );
  }

  return (
    <>
      {missingBanner}
      <ModelEditor value={text} onChange={setText} />
    </>
  );
}
