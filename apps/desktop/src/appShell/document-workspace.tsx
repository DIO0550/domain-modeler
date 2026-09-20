import {
  Activity,
  useEffect,
  useEffectEvent,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  Document,
  History,
  Serialize,
  type History as CanvasHistory,
} from "@domain-modeler/canvas-core";
import { ModelDiagnostics } from "@/features/model";
import {
  CanvasEditor,
  type HistoryControlsValue,
  type SaveIndicatorStatus,
} from "@/features/canvas";
import {
  AutoSaveProvider,
  AutoSave,
  useAutoSave,
  type AutoSaveContextValue,
  type AutoSaveOperations,
} from "@/features/auto-save";
import { selectSavePath } from "@/libs/file-dialog";
import { sameFilePath } from "@/libs/file-path";
import { FileActions } from "./fileActions";
import { UnsavedCloseDialog } from "./unsaved-close-dialog";
import { createFile, writeFile } from "@/libs/file-write";
import type { FileWatchOperations, FileWatchEvent } from "@/libs/file-watch";
import {
  ExternalFileEvents,
  type ExternalFileDocument,
  type ExternalFileEventError,
} from "./external-file-events";
import type { TabsState, TabsAction, Tab } from "./tabs";

type DocumentWorkspaceProps = Readonly<{
  tabsState: TabsState;
  registerManualSave?: (
    path: string,
    save: () => Promise<boolean>,
  ) => () => void;
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
          | "savedTab"
          | "markFileMissing"
          | "clearFileMissing"
          | "markBackgroundChanged";
      }
    >,
  ) => void;
  onHistoryControlsChange?: (
    path: string,
    controls: HistoryControlsValue | undefined,
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
    }>
  | Readonly<{
      kind: "unreadable";
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
  registerManualSave,
  autoSaveOperations = DEFAULT_AUTO_SAVE_OPERATIONS,
  fileWatchOperations,
  dispatchExternalFileAction,
  onHistoryControlsChange,
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
          key={tab.sessionKey ?? tab.path}
          tab={tab}
          isActive={tab.path === tabsState.activePath}
          registerSaveSession={registerSaveSession}
          registerManualSave={registerManualSave}
          openPaths={tabsState.tabs
            .filter((item) => item.fileState.status !== "unsaved")
            .map((item) => item.path)}
          autoSaveOperations={autoSaveOperations}
          fileWatchOperations={fileWatchOperations}
          dispatchExternalFileAction={dispatchExternalFileAction}
          onHistoryControlsChange={onHistoryControlsChange}
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
  registerManualSave,
  openPaths,
  autoSaveOperations,
  fileWatchOperations,
  dispatchExternalFileAction,
  onHistoryControlsChange,
}: Readonly<{
  tab: Tab;
  isActive: boolean;
  registerSaveSession?: DocumentWorkspaceProps["registerSaveSession"];
  registerManualSave?: DocumentWorkspaceProps["registerManualSave"];
  openPaths?: readonly string[];
  autoSaveOperations: AutoSaveOperations;
  fileWatchOperations?: FileWatchOperations;
  dispatchExternalFileAction?: DocumentWorkspaceProps["dispatchExternalFileAction"];
  onHistoryControlsChange?: DocumentWorkspaceProps["onHistoryControlsChange"];
}>) {
  const initialContents =
    tab.documentType === "canvas" ? EMPTY_CANVAS_CONTENTS : "";
  return (
    <AutoSaveProvider
      path={
        tab.fileState.status === "unsaved" ? { draftId: tab.path } : tab.path
      }
      sessionKey={tab.sessionKey ?? tab.path}
      initialContents={initialContents}
      operations={autoSaveOperations}
    >
      <PersistedDocument
        tab={tab}
        isActive={isActive}
        registerSaveSession={registerSaveSession}
        registerManualSave={registerManualSave}
        openPaths={openPaths}
        fileWatchOperations={fileWatchOperations}
        dispatchExternalFileAction={dispatchExternalFileAction}
        onHistoryControlsChange={onHistoryControlsChange}
      />
    </AutoSaveProvider>
  );
}

function PersistedDocument({
  tab,
  isActive,
  registerSaveSession,
  registerManualSave,
  openPaths,
  fileWatchOperations,
  dispatchExternalFileAction,
  onHistoryControlsChange,
}: Readonly<{
  tab: Tab;
  isActive: boolean;
  registerSaveSession?: DocumentWorkspaceProps["registerSaveSession"];
  registerManualSave?: DocumentWorkspaceProps["registerManualSave"];
  openPaths?: readonly string[];
  fileWatchOperations?: FileWatchOperations;
  dispatchExternalFileAction?: DocumentWorkspaceProps["dispatchExternalFileAction"];
  onHistoryControlsChange?: DocumentWorkspaceProps["onHistoryControlsChange"];
}>) {
  const autoSave = useAutoSave();
  const [saveAttempt, setSaveAttempt] = useState<
    | Readonly<{ status: "idle" | "saving" }>
    | Readonly<{ status: "failed"; message: string }>
  >({ status: "idle" });
  const saveTask = useRef<Promise<boolean> | undefined>(undefined);
  const closeTask = useRef<Promise<boolean> | undefined>(undefined);
  const [closeChoice, setCloseChoice] =
    useState<
      Readonly<{ resolve: (choice: "save" | "discard" | "cancel") => void }>
    >();

  const [text, setText] = useState("");
  const [canvas, dispatchCanvas] = useReducer(canvasSessionReducer, {
    history: History.create(EMPTY_CANVAS_DOCUMENT),
    draftHistory: undefined,
    revision: 0,
  });
  const [watchError, setWatchError] = useState<string>();
  const [externalConflict, setExternalConflict] =
    useState<ExternalFileConflict>();
  const textRef = useRef(text);
  const canvasRef = useRef(canvas);
  textRef.current = text;
  canvasRef.current = canvas;

  const flushDocument = async (): Promise<boolean> => {
    if (autoSave === undefined) {
      return true;
    }
    while (true) {
      const currentCanvas = canvasRef.current;
      if (currentCanvas.draftHistory !== undefined) {
        const committedCanvas = {
          history: currentCanvas.draftHistory,
          draftHistory: undefined,
          revision: currentCanvas.revision + 1,
        };
        canvasRef.current = committedCanvas;
        dispatchCanvas({
          type: "draftCommitted",
          history: currentCanvas.draftHistory,
        });
        autoSave.notifyContentsChanged(
          Serialize.stringify(currentCanvas.draftHistory.current),
        );
      }
      if (!(await autoSave.flush())) {
        return false;
      }
      if (canvasRef.current.draftHistory === undefined) {
        return true;
      }
    }
  };

  const currentContents = (): string =>
    tab.documentType === "canvas"
      ? Serialize.stringify(
          (canvasRef.current.draftHistory ?? canvasRef.current.history).current,
        )
      : textRef.current;

  const saveDocument = (): Promise<boolean> => {
    if (saveTask.current !== undefined) {
      return saveTask.current;
    }
    const run = async (): Promise<boolean> => {
      if (autoSave === undefined) {
        return false;
      }
      if (autoSave.autoSave.status !== "unsaved") {
        return flushDocument();
      }
      setSaveAttempt({ status: "saving" });
      let writtenContents = "";
      const result = await FileActions.saveNewDocument(
        tab.documentType,
        {
          selectSavePath,
          sameFilePath,
          contents: currentContents,
          createFile: async (path, contents) => {
            writtenContents = contents;
            return createFile(path, contents);
          },
          openTab: () => {},
        },
        openPaths,
      );
      if (result.status === "dialogFailed") {
        setSaveAttempt({ status: "failed", message: result.message });
        return false;
      }
      if (result.status === "writeFailed") {
        setSaveAttempt({ status: "failed", message: result.error.message });
        return false;
      }
      setSaveAttempt({ status: "idle" });
      if (result.status !== "created") {
        return false;
      }
      autoSave.notifyContentsChanged(currentContents());
      autoSave.attachFile({ path: result.path, contents: writtenContents });
      dispatchExternalFileAction?.({
        type: "savedTab",
        draftPath: tab.path,
        path: result.path,
      });
      return flushDocument();
    };
    const task = run();
    saveTask.current = task;
    void task.finally(() => {
      saveTask.current = undefined;
    });
    return task;
  };

  const closeLatestDocument = useEffectEvent((): Promise<boolean> => {
    if (closeTask.current !== undefined) {
      return closeTask.current;
    }
    const run = async (): Promise<boolean> => {
      if (autoSave === undefined) {
        return false;
      }
      if (saveTask.current !== undefined && !(await saveTask.current)) {
        return false;
      }
      if ((await autoSave.waitForPendingWrites()).status !== "unsaved") {
        return flushDocument();
      }
      const choice = await new Promise<"save" | "discard" | "cancel">(
        (resolve) => setCloseChoice({ resolve }),
      );
      setCloseChoice(undefined);
      if (choice === "discard") {
        return true;
      }
      if (choice === "cancel") {
        return false;
      }
      return saveDocument();
    };
    const task = run();
    closeTask.current = task;
    void task.finally(() => {
      closeTask.current = undefined;
    });
    return task;
  });
  const saveLatestDocument = useEffectEvent(saveDocument);

  useEffect(() => {
    if (autoSave === undefined || registerSaveSession === undefined) {
      return;
    }
    return registerSaveSession(tab.path, () => closeLatestDocument());
  }, [autoSave, canvas, registerSaveSession, tab.path]);

  useEffect(() => {
    return registerManualSave?.(tab.path, () => saveLatestDocument());
  }, [registerManualSave, tab.path]);

  const handleFileWatchEvent = useEffectEvent(
    async (_event: FileWatchEvent): Promise<void> => {
      if (
        autoSave === undefined ||
        dispatchExternalFileAction === undefined ||
        fileWatchOperations === undefined
      ) {
        return;
      }
      if (_event.type === "watchFailed") {
        autoSave.pause();
        const snapshot = await autoSave.waitForPendingWrites();
        setWatchError(_event.message);
        setExternalConflict({
          kind: "unreadable",
          savedContents: snapshot.lastSavedContents,
        });
        return;
      }
      const currentDocument = (): ExternalFileDocument =>
        tab.documentType === "canvas"
          ? { documentType: "canvas", history: canvasRef.current.history }
          : { documentType: "model", contents: textRef.current };
      const hasUnsavedContents = (snapshot: AutoSave): boolean =>
        AutoSave.isDirty(snapshot) ||
        canvasRef.current.draftHistory !== undefined;
      const operations = {
        readFile: fileWatchOperations.readFile,
        hashContents: (contents: string): string => contents,
        dispatchTabs: dispatchExternalFileAction,
        notifyError: (error: ExternalFileEventError): void => {
          setWatchError(externalFileErrorMessage(error));
        },
      };
      autoSave.pause();
      let saveSnapshot = await autoSave.waitForPendingWrites();
      while (true) {
        const document = currentDocument();
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
          const settledSnapshot = await autoSave.waitForPendingWrites();
          if (
            result.error.kind === "readFailed" &&
            result.error.error.kind === "notFound"
          ) {
            const latestDocument = currentDocument();
            ExternalFileEvents.handleDeleted(
              { path: tab.path, document: latestDocument },
              operations,
            );
            setWatchError(undefined);
            if (hasUnsavedContents(settledSnapshot)) {
              setExternalConflict({
                kind: "deleted",
                document: latestDocument,
                savedContents: settledSnapshot.lastSavedContents,
              });
              return;
            }
            autoSave.resume();
            return;
          }
          setExternalConflict({
            kind: "unreadable",
            savedContents: settledSnapshot.lastSavedContents,
          });
          return;
        }
        setWatchError(undefined);
        if (result.status === "ignored") {
          setExternalConflict((current) =>
            current?.kind === "unreadable" ? undefined : current,
          );
          autoSave.resume();
          return;
        }
        if (
          saveSnapshot.status === "saving" &&
          result.fileHash === saveSnapshot.writingContents
        ) {
          setExternalConflict((current) =>
            current?.kind === "unreadable" ? undefined : current,
          );
          autoSave.resume();
          return;
        }
        const settledSnapshot = await autoSave.waitForPendingWrites();
        if (settledSnapshot !== saveSnapshot) {
          saveSnapshot = settledSnapshot;
          continue;
        }
        if (hasUnsavedContents(settledSnapshot)) {
          setExternalConflict({
            kind: "changed",
            document: result.document,
            fileContents: result.fileHash,
          });
          return;
        }
        autoSave.acceptExternalContents(result.fileHash);
        applyExternalDocument(result.document, {
          setText,
          canvasRef,
          dispatchCanvas,
        });
        setExternalConflict(undefined);
        return;
      }
    },
  );
  const handleWatchSetupFailure = useEffectEvent(
    async (message: string): Promise<void> => {
      if (autoSave === undefined) {
        return;
      }
      autoSave.pause();
      const snapshot = await autoSave.waitForPendingWrites();
      setWatchError(message);
      setExternalConflict({
        kind: "unreadable",
        savedContents: snapshot.lastSavedContents,
      });
    },
  );

  useEffect(() => {
    if (
      fileWatchOperations === undefined ||
      tab.fileState.status === "unsaved"
    ) {
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
            void handleWatchSetupFailure(result.error.message);
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
  }, [fileWatchOperations, tab.path, tab.fileState.status]);

  if (autoSave === undefined) {
    return null;
  }
  const useExternalContents = (): void => {
    if (externalConflict === undefined) {
      return;
    }
    if (externalConflict.kind === "unreadable") {
      return;
    }
    if (externalConflict.kind === "changed") {
      autoSave.acceptExternalContents(externalConflict.fileContents);
      applyExternalDocument(externalConflict.document, {
        setText,
        canvasRef,
        dispatchCanvas,
      });
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
    applyExternalDocument(restored.document, {
      setText,
      canvasRef,
      dispatchCanvas,
    });
    setExternalConflict(undefined);
  };
  const keepEditingContents = async (): Promise<void> => {
    if (externalConflict === undefined) {
      return;
    }
    const requestedDraft = canvasRef.current.draftHistory;
    const localHistory = requestedDraft ?? canvasRef.current.history;
    const currentContents =
      tab.documentType === "canvas"
        ? Serialize.stringify(localHistory.current)
        : text;
    if (!(await autoSave.overwrite(currentContents))) {
      setWatchError("編集内容でファイルを上書きできませんでした");
      return;
    }
    if (tab.documentType === "canvas") {
      const latestDraft = canvasRef.current.draftHistory;
      if (requestedDraft !== undefined && latestDraft === requestedDraft) {
        canvasRef.current = {
          history: localHistory,
          draftHistory: undefined,
          revision: canvasRef.current.revision + 1,
        };
        dispatchCanvas({ type: "draftCommitted", history: localHistory });
        autoSave.acceptExternalContents(currentContents);
      } else if (latestDraft !== undefined) {
        autoSave.notifyContentsChanged(
          Serialize.stringify(latestDraft.current),
        );
      }
    }
    setWatchError(undefined);
    setExternalConflict(undefined);
  };
  return (
    <section
      className="document-workspace__document"
      hidden={!isActive && closeChoice === undefined}
    >
      {saveAttempt.status === "failed" && (
        <p className="document-workspace__banner" role="alert">
          保存できませんでした: {saveAttempt.message}
        </p>
      )}
      {tab.fileState.status === "unsaved" && (
        <p className="document-workspace__banner" role="status">
          未保存 — 初回の保存で保存先を選択してください。
          <button
            type="button"
            disabled={saveAttempt.status === "saving"}
            onClick={() => void saveDocument()}
          >
            {saveAttempt.status === "saving" ? "保存中…" : "保存"}
          </button>
        </p>
      )}
      {closeChoice && (
        <UnsavedCloseDialog name={tab.path} onChoose={closeChoice.resolve} />
      )}
      <Activity mode={isActive ? "visible" : "hidden"}>
        <DocumentEditor
          tab={tab}
          autoSave={autoSave}
          text={text}
          setText={setText}
          canvas={canvas}
          canvasRef={canvasRef}
          dispatchCanvas={dispatchCanvas}
          watchError={watchError}
          externalConflict={externalConflict}
          isActive={isActive}
          onUseExternalContents={useExternalContents}
          onKeepEditingContents={keepEditingContents}
          onHistoryControlsChange={onHistoryControlsChange}
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
  canvasRef,
  dispatchCanvas,
  watchError,
  externalConflict,
  isActive,
  onUseExternalContents,
  onKeepEditingContents,
  onHistoryControlsChange,
}: Readonly<{
  tab: Tab;
  autoSave: AutoSaveContextValue;
  text: string;
  setText: (text: string) => void;
  canvas: CanvasSessionState;
  canvasRef: React.MutableRefObject<CanvasSessionState>;
  dispatchCanvas: React.Dispatch<CanvasSessionAction>;
  watchError: string | undefined;
  externalConflict: ExternalFileConflict | undefined;
  isActive: boolean;
  onUseExternalContents: () => void;
  onKeepEditingContents: () => void;
  onHistoryControlsChange?: DocumentWorkspaceProps["onHistoryControlsChange"];
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
        {externalConflictMessage(externalConflict)}
        <button type="button" onClick={onKeepEditingContents}>
          {externalConflictKeepLabel(externalConflict)}
        </button>
        {externalConflict.kind !== "unreadable" && (
          <button type="button" onClick={onUseExternalContents}>
            {externalConflict.kind === "deleted"
              ? "削除を維持"
              : "外部変更を読み込む"}
          </button>
        )}
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
          isActive={isActive}
          key={`${tab.sessionKey ?? tab.path}:${canvas.revision}`}
          initialHistory={canvas.history}
          saveStatus={saveStatusOf(autoSave.autoSave)}
          onHistoryChange={(history) => {
            if (canvasRef.current.revision !== canvas.revision) {
              return;
            }
            canvasRef.current = {
              ...canvasRef.current,
              history,
              draftHistory: undefined,
            };
            dispatchCanvas({ type: "historyChanged", history });
            autoSave.notifyContentsChanged(
              Serialize.stringify(history.current),
            );
          }}
          onDraftHistoryChange={(history) => {
            if (canvasRef.current.revision !== canvas.revision) {
              return;
            }
            canvasRef.current = {
              ...canvasRef.current,
              draftHistory: history,
            };
            dispatchCanvas({ type: "draftChanged", history });
          }}
          onHistoryControlsChange={(controls) => {
            onHistoryControlsChange?.(tab.path, controls);
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
      <ModelDiagnostics
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
  if (autoSave.status === "unsaved") {
    return "unsaved";
  }
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
  target: Readonly<{
    setText: (text: string) => void;
    canvasRef: React.RefObject<CanvasSessionState>;
    dispatchCanvas: React.Dispatch<CanvasSessionAction>;
  }>,
): void => {
  if (document.documentType === "model") {
    target.setText(document.contents);
    return;
  }
  target.canvasRef.current = {
    history: document.history,
    draftHistory: undefined,
    revision: target.canvasRef.current.revision + 1,
  };
  target.dispatchCanvas({
    type: "externalApplied",
    history: document.history,
  });
};

const externalFileErrorMessage = (error: ExternalFileEventError): string => {
  if (error.kind === "readFailed") {
    return error.error.kind === "readFailed"
      ? error.error.message
      : error.error.kind;
  }
  return error.error.message;
};

const externalConflictMessage = (conflict: ExternalFileConflict): string => {
  if (conflict.kind === "deleted") {
    return "外部でファイルが削除され、未保存の編集と競合しています。";
  }
  if (conflict.kind === "unreadable") {
    return "外部のファイル状態を確認できないため、自動保存を停止しています。";
  }
  return "外部の変更と未保存の編集が競合しています。";
};

const externalConflictKeepLabel = (conflict: ExternalFileConflict): string => {
  if (conflict.kind === "deleted") {
    return "編集内容で再作成";
  }
  if (conflict.kind === "unreadable") {
    return "編集内容で上書き";
  }
  return "編集中の内容を保存";
};
