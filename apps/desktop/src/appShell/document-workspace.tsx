import { Activity, useEffect, useState } from "react";
import { Document, Serialize } from "@domain-modeler/canvas-core";
import { ModelEditor } from "@/features/model";
import {
  CanvasEditor,
  type SaveIndicatorStatus,
} from "@/features/canvas";
import {
  AutoSaveProvider,
  useAutoSave,
  type AutoSave,
  type AutoSaveContextValue,
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
const EMPTY_CANVAS_DOCUMENT = Document.empty();
const EMPTY_CANVAS_CONTENTS = Serialize.stringify(EMPTY_CANVAS_DOCUMENT);

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
        <DocumentSession
          key={tab.path}
          tab={tab}
          isActive={tab.path === tabsState.activePath}
          registerSaveSession={registerSaveSession}
          autoSaveOperations={autoSaveOperations}
        />
      ))}
    </main>
  );
}

/** 自動保存を非表示制御の外側に置き、背景タブでも保存を継続する。 */
function DocumentSession({
  tab,
  isActive,
  registerSaveSession,
  autoSaveOperations,
}: Readonly<{
  tab: Tab;
  isActive: boolean;
  registerSaveSession?: DocumentWorkspaceProps["registerSaveSession"];
  autoSaveOperations: AutoSaveOperations;
}>) {
  const initialContents =
    tab.documentType === "canvas" ? EMPTY_CANVAS_CONTENTS : "";
  return (
    <AutoSaveProvider
      path={tab.path}
      initialContents={initialContents}
      operations={autoSaveOperations}
    >
      <PersistedDocument
        tab={tab}
        isActive={isActive}
        registerSaveSession={registerSaveSession}
      />
    </AutoSaveProvider>
  );
}

function PersistedDocument({
  tab,
  isActive,
  registerSaveSession,
}: Readonly<{
  tab: Tab;
  isActive: boolean;
  registerSaveSession?: DocumentWorkspaceProps["registerSaveSession"];
}>) {
  const autoSave = useAutoSave();

  useEffect(() => {
    if (autoSave === undefined || registerSaveSession === undefined) {
      return;
    }
    return registerSaveSession(tab.path, autoSave.flush);
  }, [autoSave, registerSaveSession, tab.path]);

  if (autoSave === undefined) {
    return null;
  }
  return (
    <section className="document-workspace__document" hidden={!isActive}>
      <Activity mode={isActive ? "visible" : "hidden"}>
        <DocumentEditor tab={tab} autoSave={autoSave} />
      </Activity>
    </section>
  );
}

/** 文書ごとの編集セッションを保持し、タブ切り替えでも内容を維持する。 */
function DocumentEditor({
  tab,
  autoSave,
}: Readonly<{
  tab: Tab;
  autoSave: AutoSaveContextValue;
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
          initialDocument={EMPTY_CANVAS_DOCUMENT}
          saveStatus={saveStatusOf(autoSave.autoSave)}
          onDocumentChange={(document) => {
            autoSave.notifyContentsChanged(Serialize.stringify(document));
          }}
        />
      </>
    );
  }

  return (
    <>
      {missingBanner}
      <ModelEditor
        value={text}
        onChange={(nextText) => {
          setText(nextText);
          autoSave.notifyContentsChanged(nextText);
        }}
      />
    </>
  );
}

const saveStatusOf = (autoSave: AutoSave): SaveIndicatorStatus => {
  if (autoSave.status === "idle") {
    return "saved";
  }
  if (autoSave.status === "failed") {
    return "failed";
  }
  return "saving";
};
