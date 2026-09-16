import {
  Activity,
  useEffect,
  useEffectEvent,
  useReducer,
  useState,
} from "react";
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

type ExternalFileConflict =
  | Readonly<{
      kind: "changed";
      document: ExternalFileDocument;
      fileContents: string;
    }>
  | Readonly<{
      kind: "deleted";
      document: ExternalFileDocument;
      savedContents: string;
    }>;

type CanvasSessionState = Readonly<{
  history: CanvasHistory;
  draftHistory: CanvasHistory | undefined;
  revision: number;
}>;

type CanvasSessionAction =
  | Readonly<{ type: "historyChanged"; history: CanvasHistory }>
  | Readonly<{ type: "draftChanged"; history: CanvasHistory | undefined }>
  | Readonly<{ type: "externalApplied"; history: CanvasHistory }>
  | Readonly<{ type: "draftCommitted"; history: CanvasHistory }>;

const canvasSessionReducer = (
  state: CanvasSessionState,
  action: CanvasSessionAction,
): CanvasSessionState => {
  if (action.type === "historyChanged") {
    return { ...state, history: action.history, draftHistory: undefined };
  }
  if (action.type === "draftChanged") {
    return { ...state, draftHistory: action.history };
  }
  return {
    history: action.history,
    draftHistory: undefined,
    revision: state.revision + 1,
  };
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
  const [canvas, dispatchCanvas] = useReducer(canvasSessionReducer, {
    history: History.create(EMPTY_CANVAS_DOCUMENT),
    draftHistory: undefined,
    revision: 0,
  });
  const [watchError, setWatchError] = useState<string>();
  const [externalConflict, setExternalConflict] =
    useState<ExternalFileConflict>();

  const flushDocument = async (): Promise<boolean> => {
    if (autoSave === undefined) {
      return true;
    }
    if (canvas.draftHistory !== undefined) {
      dispatchCanvas({
        type: "draftCommitted",
        history: canvas.draftHistory,
      });
      autoSave.notifyContentsChanged(
        Serialize.stringify(canvas.draftHistory.current),
      );
    }
    return await autoSave.flush();
  };

  useEffect(() => {
    if (autoSave === undefined || registerSaveSession === undefined) {
      return;
    }
    return registerSaveSession(tab.path, flushDocument);
  }, [autoSave, canvas.draftHistory, registerSaveSession, tab.path]);

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
      let saveSnapshot: AutoSave;
      if (event.type === "deleted") {
        autoSave.pause();
        saveSnapshot = await autoSave.waitForPendingWrites();
        const readResult = await fileWatchOperations.readFile(tab.path);
        if (readResult.type === "err") {
          if (readResult.error.kind !== "notFound") {
            operations.notifyError({
              kind: "readFailed",
              error: readResult.error,
            });
            autoSave.resume();
            return;
          }
          ExternalFileEvents.handleDeleted(
            { path: tab.path, document },
            operations,
          );
          setWatchError(undefined);
          if (
            AutoSave.isDirty(saveSnapshot) ||
            canvas.draftHistory !== undefined
          ) {
            setExternalConflict({
              kind: "deleted",
              document,
              savedContents: saveSnapshot.lastSavedContents,
            });
            return;
          }
          autoSave.resume();
          return;
        }
      } else {
        saveSnapshot = await autoSave.waitForPendingWrites();
      }
      while (true) {
        const result = await ExternalFileEvents.handleChanged(
          {
            path: tab.path,
            activation: isActive ? "active" : "background",
            lastSavedHash: saveSnapshot.lastSavedContents,
            document,
          },
          operations,
        );
        if (result.status === "rejected") {
          if (
            event.type === "deleted" &&
            result.error.kind === "readFailed" &&
            result.error.error.kind === "notFound"
          ) {
            ExternalFileEvents.handleDeleted(
              { path: tab.path, document },
              operations,
            );
            setWatchError(undefined);
            if (
              AutoSave.isDirty(saveSnapshot) ||
              canvas.draftHistory !== undefined
            ) {
              setExternalConflict({
                kind: "deleted",
                document,
                savedContents: saveSnapshot.lastSavedContents,
              });
              return;
            }
          }
          if (event.type === "deleted") {
            autoSave.resume();
          }
          return;
        }
        setWatchError(undefined);
        if (result.status === "ignored") {
          if (event.type === "deleted") {
            autoSave.resume();
          }
          return;
        }
        if (
          saveSnapshot.status === "saving" &&
          result.fileHash === saveSnapshot.writingContents
        ) {
          if (event.type === "deleted") {
            autoSave.resume();
          }
          return;
        }
        const settledSnapshot = await autoSave.waitForPendingWrites();
        if (settledSnapshot !== saveSnapshot) {
          saveSnapshot = settledSnapshot;
          continue;
        }
        if (
          AutoSave.isDirty(settledSnapshot) ||
          canvas.draftHistory !== undefined
        ) {
          autoSave.pause();
          setExternalConflict({
            kind: "changed",
            document: result.document,
            fileContents: result.fileHash,
          });
          return;
        }
        autoSave.acceptExternalContents(result.fileHash);
        applyExternalDocument(result.document, setText, dispatchCanvas);
        return;
      }
    },
  );

  useEffect(() => {
    if (fileWatchOperations === undefined) {
      return;
    }
    let stopped = false;
    let stop: (() => Promise<void>) | undefined;
    let eventQueue = Promise.resolve();
    void fileWatchOperations
      .watch(tab.path, (event) => {
        const handleQueuedEvent = async (): Promise<void> => {
          if (!stopped) {
            await handleFileWatchEvent(event);
          }
        };
        eventQueue = eventQueue.then(handleQueuedEvent, handleQueuedEvent);
      })
      .then((result) => {
        if (result.type === "err") {
          if (!stopped) {
            setWatchError(result.error.message);
          }
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
    if (externalConflict.kind === "changed") {
      autoSave.acceptExternalContents(externalConflict.fileContents);
      applyExternalDocument(externalConflict.document, setText, dispatchCanvas);
      setExternalConflict(undefined);
      return;
    }
    const restored = ExternalFileEvents.restoreSavedContents(
      externalConflict.document,
      externalConflict.savedContents,
    );
    if (!restored.ok) {
      setWatchError(
        externalFileErrorMessage({
          kind: "invalidCanvas",
          path: tab.path,
          error: restored.error,
        }),
      );
      return;
    }
    autoSave.acceptExternalContents(externalConflict.savedContents);
    applyExternalDocument(restored.document, setText, dispatchCanvas);
    setExternalConflict(undefined);
  };
  const keepEditingContents = (): void => {
    if (externalConflict === undefined) {
      return;
    }
    const localHistory = canvas.draftHistory ?? canvas.history;
    const currentContents =
      tab.documentType === "canvas"
        ? Serialize.stringify(localHistory.current)
        : text;
    const savedContents =
      externalConflict.kind === "changed"
        ? externalConflict.fileContents
        : externalConflict.savedContents;
    if (canvas.draftHistory !== undefined) {
      dispatchCanvas({ type: "draftCommitted", history: localHistory });
    }
    autoSave.acceptExternalContents(savedContents);
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
          dispatchCanvas={dispatchCanvas}
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
  dispatchCanvas,
  watchError,
  externalConflict,
  onUseExternalContents,
  onKeepEditingContents,
}: Readonly<{
  tab: Tab;
  autoSave: AutoSaveContextValue;
  text: string;
  setText: (text: string) => void;
  canvas: CanvasSessionState;
  dispatchCanvas: React.Dispatch<CanvasSessionAction>;
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
        {externalConflict.kind === "deleted"
          ? "外部でファイルが削除され、未保存の編集と競合しています。"
          : "外部の変更と未保存の編集が競合しています。"}
        <button type="button" onClick={onKeepEditingContents}>
          {externalConflict.kind === "deleted"
            ? "編集内容で再作成"
            : "編集中の内容を保存"}
        </button>
        <button type="button" onClick={onUseExternalContents}>
          {externalConflict.kind === "deleted"
            ? "削除を維持"
            : "外部変更を読み込む"}
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
            dispatchCanvas({ type: "historyChanged", history });
            autoSave.notifyContentsChanged(Serialize.stringify(history.current));
          }}
          onDraftHistoryChange={(history) => {
            dispatchCanvas({ type: "draftChanged", history });
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
  dispatchCanvas: React.Dispatch<CanvasSessionAction>,
): void => {
  if (document.documentType === "model") {
    setText(document.contents);
    return;
  }
  dispatchCanvas({ type: "externalApplied", history: document.history });
};

const externalFileErrorMessage = (error: ExternalFileEventError): string => {
  if (error.kind === "readFailed") {
    return error.error.kind === "readFailed"
      ? error.error.message
      : error.error.kind;
  }
  return error.error.message;
};
