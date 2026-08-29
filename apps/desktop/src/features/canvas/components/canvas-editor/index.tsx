import type { Document, StickyId } from "@domain-modeler/canvas-core";
import type { SaveIndicatorStatus } from "../../domains/save-indicator";
import type { StickySession } from "../../domains/sticky-interaction";
import { useStickyInteractions } from "../../hooks";
import { Sticky, type StickyChrome } from "../sticky";
import { CanvasView, type HistoryButton } from "../canvas-view";

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
      undo={historyButton(board.hasUndo, board.undo)}
      redo={historyButton(board.hasRedo, board.redo)}
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
          chrome={chromeOf(board.session, sticky.id, {
            onDraftChange: board.changeDraft,
            onCommit: board.commitEdit,
          })}
        />
      ))}
    </CanvasView>
  );
}

/**
 * undo / redo を、有効なときだけハンドラを持つボタンにする。
 *
 * @param available 実行できるか。
 * @param onClick 実行する操作。
 * @returns 履歴ボタン。
 */
const historyButton = (available: boolean, onClick: () => void): HistoryButton => {
  if (!available) {
    return { availability: "disabled" };
  }
  return { availability: "enabled", onClick };
};

type DraftHandlers = Readonly<{
  onDraftChange: (text: string) => void;
  onCommit: () => void;
}>;

/**
 * 対象の付箋に出す選択枠または本文編集を返す。
 *
 * @param session キャンバス全体の選択と編集。
 * @param stickyId この付箋の ID。
 * @param handlers 本文の下書き更新と確定。
 * @returns その付箋の表示。
 */
const chromeOf = (
  session: StickySession,
  stickyId: StickyId,
  handlers: DraftHandlers,
): StickyChrome => {
  if (session.status === "idle" || session.stickyId !== stickyId) {
    return { status: "plain" };
  }
  if (session.status === "selected") {
    return { status: "selected" };
  }
  return {
    status: "editing",
    draftText: session.draftText,
    onDraftChange: handlers.onDraftChange,
    onCommit: handlers.onCommit,
  };
};
