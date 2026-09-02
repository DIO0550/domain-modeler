import type { Document } from "@domain-modeler/canvas-core";
import type { SaveIndicatorStatus } from "../../domains/save-indicator";
import { ConnectionSession } from "../../domains/connection-interaction";
import { StickySession } from "../../domains/sticky-interaction";
import { useConnectionInteractions } from "../../hooks";
import { Sticky, StickyChrome } from "../sticky";
import { CanvasView, HistoryButton } from "../canvas-view";
import { ConnectionLayer } from "../connection-layer";

type CanvasEditorProps = Readonly<{
  zoom: number;
  saveStatus: SaveIndicatorStatus;
  initialDocument?: Document;
}>;

/**
 * 付箋の作成・選択・本文編集ができるキャンバス画面。
 *
 * @param props ズーム、保存状態、初期文書。
 * @returns 操作可能なキャンバス。
 */
export function CanvasEditor({
  zoom,
  saveStatus,
  initialDocument,
}: CanvasEditorProps) {
  const board = useConnectionInteractions(initialDocument);
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
      zoom={zoom}
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
      onSurfaceClick={board.clickAt}
      onSurfaceDoubleClick={board.doubleClickAt}
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
                    board.beginDrag(sticky.id, point);
                  },
                  onResizeStart: board.beginResize,
                  onPointerMove: board.movePointer,
                  onPointerCommit: board.commitManipulation,
                  onPointerCancel: board.cancelManipulation,
                }
          }
        />
      ))}
    </CanvasView>
  );
}
