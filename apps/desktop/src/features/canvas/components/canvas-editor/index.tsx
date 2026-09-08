import { CANVAS_SHORTCUTS, CanvasShortcut } from "../../domains/shortcut";
import { EventTargetEx } from "@/utils/EventTargetEx";
import type { Document } from "@domain-modeler/canvas-core";
import type { SaveIndicatorStatus } from "../../domains/save-indicator";
import { ConnectionSession } from "../../domains/connection-session";
import { StickySession } from "../../domains/sticky-interaction";
import {
  useConnectionInteractions,
  useViewportInteractions,
} from "../../hooks";
import { Sticky, StickyChrome } from "../sticky";
import { CanvasView, HistoryButton } from "../canvas-view";
import { ConnectionLayer } from "../connection-layer";

type CanvasEditorProps = Readonly<{
  saveStatus: SaveIndicatorStatus;
  initialDocument?: Document;
}>;

/**
 * 付箋の作成・選択・本文編集ができるキャンバス画面。
 *
 * @param props 保存状態、初期文書。
 * @returns 操作可能なキャンバス。
 */
export function CanvasEditor({
  saveStatus,
  initialDocument,
}: CanvasEditorProps) {
  const board = useConnectionInteractions(initialDocument);
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
      onKeyDown={(event) => {
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
      onSelectType={board.selectType}
      onSurfaceClick={(point) => {
        board.clickAt(viewport.toWorldPoint(point));
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
        onToggle: board.toggleConnectionMode,
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
      {board.stickies.map((sticky) => (
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
        />
      ))}
    </CanvasView>
  );
}
