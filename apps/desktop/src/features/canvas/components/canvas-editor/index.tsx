import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { CANVAS_SHORTCUTS, CanvasShortcut } from "../../domains/shortcut";
import { EventTargetEx } from "@/utils/EventTargetEx";
import type { Document, History } from "@domain-modeler/canvas-core";
import type { SaveIndicatorStatus } from "../../domains/save-indicator";
import { ConnectionSession } from "../../domains/connection-session";
import { StickySession } from "../../domains/sticky-interaction";
import {
  useConnectionInteractions,
  useViewportInteractions,
} from "../../hooks";
import { Sticky, StickyChrome } from "../sticky";
import { CanvasView, HistoryButton } from "../canvas-view";
import { ConnectionHandles } from "../connection-handles";
import { ConnectionLayer } from "../connection-layer";

type CanvasEditorProps = Readonly<{
  saveStatus: SaveIndicatorStatus;
  initialDocument?: Document;
  initialHistory?: History;
  onDocumentChange?: (document: Document) => void;
  onHistoryChange?: (history: History) => void;
  onDraftHistoryChange?: (history: History | undefined) => void;
}>;

/**
 * 付箋の作成・選択・本文編集ができるキャンバス画面。
 *
 * @param props 保存状態、初期文書または履歴、変更通知。
 * @returns 操作可能なキャンバス。
 */
export function CanvasEditor({
  saveStatus,
  initialDocument,
  initialHistory,
  onDocumentChange,
  onHistoryChange,
  onDraftHistoryChange,
}: CanvasEditorProps) {
  const [placementActive, setPlacementActive] = useState(false);
  // 接続ジェスチャー由来のclick/dblclickを、次の新しい押下まで抑止する。
  const suppressConnectionClick = useRef(false);
  const stopConnectionClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (!suppressConnectionClick.current || event.detail === 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };
  const notifyDocumentChange = useEffectEvent((document: Document): void => {
    onDocumentChange?.(document);
  });
  const notifyHistoryChange = useEffectEvent((history: History): void => {
    onHistoryChange?.(history);
  });
  const board = useConnectionInteractions(initialDocument, initialHistory, {
    onDraftHistoryChange,
    onHistoryChange,
  });
  const notifyDraftHistoryChange = useEffectEvent(
    (history: History | undefined): void => {
      onDraftHistoryChange?.(history);
    },
  );
  useEffect(() => {
    if (
      board.session.status === "dragging" ||
      board.session.status === "resizing"
    ) {
      return;
    }
    notifyDocumentChange(board.document);
    notifyHistoryChange(board.history);
  }, [board.document, board.history, board.session.status]);
  useEffect(() => {
    notifyDraftHistoryChange(board.draftHistory);
  }, [board.draftHistory]);
  const viewport = useViewportInteractions(
    board.document.viewport,
    board.document.stickies,
    board.changeViewport,
  );
  const connectionModeActive = ConnectionSession.isCreating(
    board.connectionSession,
  );
  const connectionToolStatus =
    board.connectionSession.status === "selectingSource" ||
    board.connectionSession.status === "selectingTarget"
      ? board.connectionSession.status
      : "inactive";

  return (
    <CanvasView
      placementTool={{
        active: placementActive,
        onSelect: () => {
          setPlacementActive(false);
          board.pressEscape();
        },
      }}
      gestureEvents={{
        onPointerDownCapture: () => {
          suppressConnectionClick.current = false;
        },
        onClickCapture: stopConnectionClick,
        onDoubleClickCapture: stopConnectionClick,
      }}
      onKeyDown={(event) => {
        if (placementActive && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setPlacementActive(false);
          board.pressEscape();
          return;
        }
        if (
          event.defaultPrevented ||
          EventTargetEx.isTextEntry(event.target) ||
          board.session.status === "editing" ||
          board.session.status === "dragging" ||
          board.session.status === "resizing" ||
          board.connectionSession.status === "editing"
        ) {
          return;
        }
        const shortcut = CanvasShortcut.create(event.nativeEvent);
        if (!shortcut.some) {
          return;
        }
        event.preventDefault();
        const actions: Record<CanvasShortcut, () => void> = {
          [CANVAS_SHORTCUTS.undo]: board.undo,
          [CANVAS_SHORTCUTS.redo]: board.redo,
          [CANVAS_SHORTCUTS.delete]: board.pressDelete,
          [CANVAS_SHORTCUTS.copy]: board.copy,
          [CANVAS_SHORTCUTS.paste]: board.paste,
          [CANVAS_SHORTCUTS.front]: board.bringToFront,
          [CANVAS_SHORTCUTS.fitAll]: viewport.fitAll,
          [CANVAS_SHORTCUTS.zoomIn]: () => viewport.stepZoom(1.2),
          [CANVAS_SHORTCUTS.zoomOut]: () => viewport.stepZoom(1 / 1.2),
        };
        actions[shortcut.value]();
      }}
      viewport={viewport.viewport}
      viewportInteraction={viewport.surfaceInteraction}
      saveStatus={saveStatus}
      undo={
        board.hasUndo
          ? HistoryButton.enabled(board.undo)
          : HistoryButton.disabled()
      }
      redo={
        board.hasRedo
          ? HistoryButton.enabled(board.redo)
          : HistoryButton.disabled()
      }
      selectedType={board.selectedType}
      onSelectType={(type) => {
        board.pressEscape();
        board.selectType(type);
        setPlacementActive(true);
      }}
      onSurfaceClick={(point) => {
        if (placementActive) {
          board.clickAt(viewport.toWorldPoint(point));
          setPlacementActive(false);
          return;
        }
        board.selectAt(viewport.toWorldPoint(point));
      }}
      onSurfaceDoubleClick={(point) => {
        board.doubleClickAt(viewport.toWorldPoint(point));
      }}
      onSurfaceKeyDown={(key) => {
        if (key === "Enter") {
          board.pressEnter();
          return;
        }
        if (key === "Escape") {
          setPlacementActive(false);
          board.pressEscape();
          return;
        }
        board.pressDelete();
      }}
      connectionTool={{
        status: connectionToolStatus,
        errorMessage: board.connectionError.some
          ? board.connectionError.value.message
          : undefined,
        onToggle: () => {
          setPlacementActive(false);
          board.toggleConnectionMode();
        },
      }}
    >
      <ConnectionLayer
        document={board.document}
        interaction={{
          session: board.connectionSession,
          onSelect: board.selectConnection,
          onEdit: board.editConnection,
          onDraftChange: board.changeConnectionDraft,
          onCommitEdit: board.commitConnectionEdit,
        }}
      />
      {board.stickies.map((sticky) => {
        const target = ConnectionSession.targetOf(
          board.connectionSession,
          sticky.id,
        );
        return (
          <Sticky
            key={sticky.id}
            sticky={sticky}
            chrome={StickyChrome.of(
              StickySession.chromeOf(board.session, sticky.id),
              {
                onDraftChange: board.changeDraft,
                onCommit: board.commitEdit,
              },
            )}
            connectionEndpoint={
              ConnectionSession.isSource(board.connectionSession, sticky.id)
                ? "source"
                : target.some
                  ? "target"
                  : undefined
            }
            onActivate={
              connectionModeActive
                ? undefined
                : () => {
                    board.select(sticky.id);
                  }
            }
            onKeyActivate={
              connectionModeActive
                ? () => {
                    board.selectConnectionEndpoint(sticky.id);
                  }
                : undefined
            }
            manipulation={
              connectionModeActive
                ? undefined
                : {
                    onDragStart: (point) => {
                      board.beginDrag(
                        sticky.id,
                        viewport.toWorldClientPoint(point),
                      );
                    },
                    onResizeStart: (corner, point) => {
                      board.beginResize(
                        corner,
                        viewport.toWorldClientPoint(point),
                      );
                    },
                    onPointerMove: (point) => {
                      board.movePointer(viewport.toWorldClientPoint(point));
                    },
                    onPointerCommit: board.commitManipulation,
                    onPointerCancel: board.cancelManipulation,
                  }
            }
          >
            {StickySession.chromeOf(board.session, sticky.id).status ===
            "selected" ? (
              <ConnectionHandles
                onStart={(anchor) => {
                  setPlacementActive(false);
                  suppressConnectionClick.current = true;
                  board.beginConnectionDrag({ stickyId: sticky.id, anchor });
                }}
                onMove={(point) =>
                  board.moveConnectionDrag(viewport.toWorldClientPoint(point))
                }
                onFinish={(point) =>
                  board.finishConnectionDrag(viewport.toWorldClientPoint(point))
                }
                onCancel={board.cancelConnectionDrag}
              />
            ) : null}
            {target.some ? (
              <span
                className="sticky__connection-handle sticky__connection-target"
                data-connection-anchor={target.value.anchor}
                aria-hidden="true"
              />
            ) : null}
          </Sticky>
        );
      })}
    </CanvasView>
  );
}
