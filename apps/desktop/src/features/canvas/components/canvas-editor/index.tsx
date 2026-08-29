import type { Document } from "@domain-modeler/canvas-core";
import type { SaveIndicatorStatus } from "../../domains/save-indicator";
import { StickySession } from "../../domains/sticky-interaction";
import { useStickyInteractions } from "../../hooks";
import { Sticky, StickyChrome } from "../sticky";
import { CanvasView, HistoryButton } from "../canvas-view";

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
  const board = useStickyInteractions(initialDocument);

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
        board.pressEscape();
      }}
    >
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
          onActivate={() => {
            board.select(sticky.id);
          }}
        />
      ))}
    </CanvasView>
  );
}
