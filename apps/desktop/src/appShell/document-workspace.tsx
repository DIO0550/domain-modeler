import { Activity, useEffect, useEffectEvent, useState } from "react";
import {
  Document,
  History,
  Serialize,
  type History as CanvasHistory,
} from "@domain-modeler/canvas-core";
import { ModelEditor } from "@/features/model";
import {
  CanvasEditor,
  type SaveIndicatorStatus,
} from "@/features/canvas";
import {
  AutoSaveProvider,
  AutoSave,
  useAutoSave,
  type AutoSaveContextValue,
  type AutoSaveOperations,
} from "@/features/auto-save";
import { writeFile } from "@/libs/file-write";
import type { FileWatchOperations, FileWatchEvent } from "@/libs/file-watch";
import {
  ExternalFileEvents,
  type ExternalFileDocument,
  type ExternalFileEventError,
} from "./external-file-events";
import type { TabsState, TabsAction, Tab } from "./tabs";

type DocumentWorkspaceProps = Readonly<{
  tabsState: TabsState;
  registerSaveSession?: (
    path: string,
    flush: () => Promise<boolean>,
  ) => () => void;
  autoSaveOperations?: AutoSaveOperations;
  fileWatchOperations?: FileWatchOperations;
  dispatchExternalFileAction?: (
    action: Extract<
      TabsAction,
      {
        type:
          | "markFileMissing"
          | "clearFileMissing"
          | "markBackgroundChanged";
      }
    >,
  ) => void;
}>;

const DEFAULT_AUTO_SAVE_OPERATIONS: AutoSaveOperations = {
  writeFile,
  now: () => performance.now(),
};
const EMPTY_CANVAS_DOCUMENT = Document.empty();
const EMPTY_CANVAS_CONTENTS = Serialize.stringify(EMPTY_CANVAS_DOCUMENT);

type ExternalFileConflict = Readonly<{
  document: ExternalFileDocument;
  fileContents: string;
}>;

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
  fileWatchOperations,
  dispatchExternalFileAction,
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
          fileWatchOperations={fileWatchOperations}
          dispatchExternalFileAction={dispatchExternalFileAction}
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
  fileWatchOperations,
  dispatchExternalFileAction,
}: Readonly<{
  tab: Tab;
  isActive: boolean;
  registerSaveSession?: DocumentWorkspaceProps["registerSaveSession"];
  autoSaveOperations: AutoSaveOperations;
  fileWatchOperations?: FileWatchOperations;
  dispatchExternalFileAction?: DocumentWorkspaceProps["dispatchExternalFileAction"];
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
        fileWatchOperations={fileWatchOperations}
        dispatchExternalFileAction={dispatchExternalFileAction}
      />
    </AutoSaveProvider>
  );
}

function PersistedDocument({
  tab,
  isActive,
  registerSaveSession,
  fileWatchOperations,
  dispatchExternalFileAction,
}: Readonly<{
  tab: Tab;
  isActive: boolean;
  registerSaveSession?: DocumentWorkspaceProps["registerSaveSession"];
  fileWatchOperations?: FileWatchOperations;
  dispatchExternalFileAction?: DocumentWorkspaceProps["dispatchExternalFileAction"];
}>) {
  const autoSave = useAutoSave();
  const [text, setText] = useState("");
  const [canvas, setCanvas] = useState<Readonly<{
    history: CanvasHistory;
    revision: number;
  }>>({ history: History.create(EMPTY_CANVAS_DOCUMENT), revision: 0 });
  const [watchError, setWatchError] = useState<string>();
  const [externalConflict, setExternalConflict] =
    useState<ExternalFileConflict>();

  useEffect(() => {
    if (autoSave === undefined || registerSaveSession === undefined) {
      return;
    }
    return registerSaveSession(tab.path, autoSave.flush);
  }, [autoSave, registerSaveSession, tab.path]);

  const handleFileWatchEvent = useEffectEvent(
    async (event: FileWatchEvent): Promise<void> => {
      if (
        autoSave === undefined ||
        dispatchExternalFileAction === undefined ||
        fileWatchOperations === undefined
      ) {
        return;
      }
      const document: ExternalFileDocument =
        tab.documentType === "canvas"
          ? { documentType: "canvas", history: canvas.history }
          : { documentType: "model", contents: text };
      const operations = {
        readFile: fileWatchOperations.readFile,
        hashContents: (contents: string): string => contents,
        dispatchTabs: dispatchExternalFileAction,
        notifyError: (error: ExternalFileEventError): void => {
          setWatchError(externalFileErrorMessage(error));
        },
      };
      if (event.type === "deleted") {
        ExternalFileEvents.handleDeleted({ path: tab.path, document }, operations);
        return;
      }
      const result = await ExternalFileEvents.handleChanged(
        {
          path: tab.path,
          activation: isActive ? "active" : "background",
          lastSavedHash: autoSave.autoSave.lastSavedContents,
          document,
        },
        operations,
      );
      if (result.status !== "applied") {
        return;
      }
      setWatchError(undefined);
      if (
        autoSave.autoSave.status === "saving" &&
        result.fileHash === autoSave.autoSave.writingContents
      ) {
        return;
      }
      if (AutoSave.isDirty(autoSave.autoSave)) {
        autoSave.pause();
        setExternalConflict({
          document: result.document,
          fileContents: result.fileHash,
        });
        return;
      }
      autoSave.acceptExternalContents(result.fileHash);
      applyExternalDocument(result.document, setText, setCanvas);
    },
  );

  useEffect(() => {
    if (fileWatchOperations === undefined) {
      return;
    }
    let stopped = false;
    let stop: (() => Promise<void>) | undefined;
    void fileWatchOperations
      .watch(tab.path, (event) => {
        void handleFileWatchEvent(event);
      })
      .then((result) => {
        if (result.type === "err") {
          setWatchError(result.error.message);
          return;
        }
        if (stopped) {
          void result.stop();
          return;
        }
        stop = result.stop;
      });
    return () => {
      stopped = true;
      void stop?.();
    };
  }, [fileWatchOperations, tab.path]);

  if (autoSave === undefined) {
    return null;
  }
  const useExternalContents = (): void => {
    if (externalConflict === undefined) {
      return;
    }
    autoSave.acceptExternalContents(externalConflict.fileContents);
    applyExternalDocument(externalConflict.document, setText, setCanvas);
    setExternalConflict(undefined);
  };
  const keepEditingContents = (): void => {
    if (externalConflict === undefined) {
      return;
    }
    const currentContents =
      tab.documentType === "canvas"
        ? Serialize.stringify(canvas.history.current)
        : text;
    autoSave.acceptExternalContents(externalConflict.fileContents);
    autoSave.notifyContentsChanged(currentContents);
    setExternalConflict(undefined);
  };
  return (
    <section className="document-workspace__document" hidden={!isActive}>
      <Activity mode={isActive ? "visible" : "hidden"}>
        <DocumentEditor
          tab={tab}
          autoSave={autoSave}
          text={text}
          setText={setText}
          canvas={canvas}
          setCanvas={setCanvas}
          watchError={watchError}
          externalConflict={externalConflict}
          onUseExternalContents={useExternalContents}
          onKeepEditingContents={keepEditingContents}
        />
      </Activity>
    </section>
  );
}

/** 文書ごとの編集セッションを保持し、タブ切り替えでも内容を維持する。 */
function DocumentEditor({
  tab,
  autoSave,
  text,
  setText,
  canvas,
  setCanvas,
  watchError,
  externalConflict,
  onUseExternalContents,
  onKeepEditingContents,
}: Readonly<{
  tab: Tab;
  autoSave: AutoSaveContextValue;
  text: string;
  setText: (text: string) => void;
  canvas: Readonly<{ history: CanvasHistory; revision: number }>;
  setCanvas: (
    update: Readonly<{ history: CanvasHistory; revision: number }>,
  ) => void;
  watchError: string | undefined;
  externalConflict: ExternalFileConflict | undefined;
  onUseExternalContents: () => void;
  onKeepEditingContents: () => void;
}>) {
  const missingBanner =
    tab.fileState.status === "missing" ? (
      <p className="document-workspace__banner" role="alert">
        ファイルが見つかりません。編集を続けるとこのパスに再作成されます。
      </p>
    ) : null;
  const saveFailureBanner =
    autoSave.autoSave.status === "failed" ? (
      <p className="document-workspace__banner" role="alert">
        保存できませんでした: {autoSave.autoSave.error.message}
      </p>
    ) : null;
  const watchFailureBanner =
    watchError === undefined ? null : (
      <p className="document-workspace__banner" role="alert">
        外部のファイル変更を読み込めませんでした: {watchError}
      </p>
    );
  const conflictBanner =
    externalConflict === undefined ? null : (
      <div className="document-workspace__banner" role="alert">
        外部の変更と未保存の編集が競合しています。
        <button type="button" onClick={onKeepEditingContents}>
          編集中の内容を保存
        </button>
        <button type="button" onClick={onUseExternalContents}>
          外部変更を読み込む
        </button>
      </div>
    );

  if (tab.documentType === "canvas") {
    return (
      <>
        {missingBanner}
        {saveFailureBanner}
        {watchFailureBanner}
        {conflictBanner}
        <CanvasEditor
          key={`${tab.path}:${canvas.revision}`}
          initialHistory={canvas.history}
          saveStatus={saveStatusOf(autoSave.autoSave)}
          onHistoryChange={(history) => {
            setCanvas({
              history,
              revision: canvas.revision,
            });
            autoSave.notifyContentsChanged(Serialize.stringify(history.current));
          }}
        />
      </>
    );
  }

  return (
    <>
      {missingBanner}
      {saveFailureBanner}
      {watchFailureBanner}
      {conflictBanner}
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

const applyExternalDocument = (
  document: ExternalFileDocument,
  setText: (text: string) => void,
  setCanvas: React.Dispatch<
    React.SetStateAction<
      Readonly<{ history: CanvasHistory; revision: number }>
    >
  >,
): void => {
  if (document.documentType === "model") {
    setText(document.contents);
    return;
  }
  setCanvas((current) => ({
    history: document.history,
    revision: current.revision + 1,
  }));
};

const externalFileErrorMessage = (error: ExternalFileEventError): string => {
  if (error.kind === "readFailed") {
    return error.error.kind === "readFailed"
      ? error.error.message
      : error.error.kind;
  }
  return error.error.message;
};
