import { Activity, useEffect, useState } from "react";
import { ModelEditor } from "@/features/model";
import { CanvasEditor } from "@/features/canvas";
import {
  AutoSaveProvider,
  useAutoSave,
  type AutoSaveOperations,
} from "@/features/auto-save";
import { writeFile } from "@/libs/file-write";
import type { TabsState, Tab } from "./tabs";

type DocumentWorkspaceProps = Readonly<{
  tabsState: TabsState;
  registerSaveSession?: (
    path: string,
    flush: () => Promise<boolean>,
  ) => () => void;
  autoSaveOperations?: AutoSaveOperations;
}>;

const DEFAULT_AUTO_SAVE_OPERATIONS: AutoSaveOperations = {
  writeFile,
  now: Date.now,
};

/**
 * 文書種別に対応する編集画面を表示し、背景タブの編集状態も保持する。
 *
 * @param props タブ状態。
 * @returns 文書領域。
 */
export function DocumentWorkspace({
  tabsState,
  registerSaveSession,
  autoSaveOperations = DEFAULT_AUTO_SAVE_OPERATIONS,
}: DocumentWorkspaceProps) {
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
          <Activity mode={tab.path === tabsState.activePath ? "visible" : "hidden"}>
            <DocumentEditor
              tab={tab}
              registerSaveSession={registerSaveSession}
              autoSaveOperations={autoSaveOperations}
            />
          </Activity>
        </section>
      ))}
    </main>
  );
}

/** 文書ごとの編集セッションを保持し、タブ切り替えでも内容を維持する。 */
function DocumentEditor({
  tab,
  registerSaveSession,
  autoSaveOperations,
}: Readonly<{
  tab: Tab;
  registerSaveSession?: DocumentWorkspaceProps["registerSaveSession"];
  autoSaveOperations: AutoSaveOperations;
}>) {
  const [text, setText] = useState("");
  const missingBanner =
    tab.fileState.status === "missing" ? (
      <p className="document-workspace__banner" role="alert">
        ファイルが見つかりません。編集を続けるとこのパスに再作成されます。
      </p>
    ) : null;

  if (tab.documentType === "canvas") {
    return (
      <>
        {missingBanner}
        <CanvasEditor
          key={tab.path}
          saveStatus="saved"
        />
      </>
    );
  }

  return (
    <AutoSaveProvider
      path={tab.path}
      initialContents=""
      operations={autoSaveOperations}
    >
      {missingBanner}
      <ModelDocumentEditor
        path={tab.path}
        text={text}
        onTextChange={setText}
        registerSaveSession={registerSaveSession}
      />
    </AutoSaveProvider>
  );
}

function ModelDocumentEditor({
  path,
  text,
  onTextChange,
  registerSaveSession,
}: Readonly<{
  path: string;
  text: string;
  onTextChange: (text: string) => void;
  registerSaveSession?: DocumentWorkspaceProps["registerSaveSession"];
}>) {
  const autoSave = useAutoSave();

  useEffect(() => {
    if (autoSave === undefined || registerSaveSession === undefined) {
      return;
    }
    return registerSaveSession(path, autoSave.flush);
  }, [autoSave, path, registerSaveSession]);

  const handleChange = (nextText: string): void => {
    onTextChange(nextText);
    autoSave?.notifyContentsChanged(nextText);
  };

  return <ModelEditor value={text} onChange={handleChange} />;
}
