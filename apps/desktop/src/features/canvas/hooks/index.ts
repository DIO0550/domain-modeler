import { useMemo, useRef, useState } from "react";
import type {
  CanvasError,
  Anchor,
  Connection,
  ConnectionId,
  Document,
  History,
  Option,
  Point,
  Sticky,
  StickyId,
  StickyType,
  Viewport,
} from "@domain-modeler/canvas-core";
import { ConnectionInteraction } from "../domains/connection-interaction";
import { ConnectionSession } from "../domains/connection-session";
import {
  StickyInteraction,
  type StickyResizeCorner,
  type StickySession,
} from "../domains/sticky-interaction";

/** 付箋の作成・選択・編集操作。 */
export type UseStickyInteractionsResult = Readonly<{
  document: Document;
  history: History;
  selectedType: StickyType;
  session: StickySession;
  stickies: readonly Sticky[];
  hasUndo: boolean;
  hasRedo: boolean;
  selectType: (type: StickyType) => void;
  select: (stickyId: StickyId) => void;
  clickAt: (point: Point) => void;
  doubleClickAt: (point: Point) => void;
  changeDraft: (draftText: string) => void;
  commitEdit: () => void;
  beginDrag: (stickyId: StickyId, point: Point) => void;
  beginResize: (corner: StickyResizeCorner, point: Point) => void;
  movePointer: (point: Point) => void;
  commitManipulation: () => void;
  cancelManipulation: () => void;
  pressEnter: () => void;
  pressEscape: () => void;
  undo: () => void;
  redo: () => void;
}>;

/**
 * 付箋の作成・選択・本文編集と undo を扱う。
 *
 * @param initialDocument 初期文書。省略時は空の文書。
 * @returns 表示する付箋と操作ハンドラ。
 */
export function useStickyInteractions(
  initialDocument?: Document,
): UseStickyInteractionsResult {
  const [interaction, setInteraction] = useState(() =>
    StickyInteraction.create(initialDocument),
  );

  return {
    document: interaction.workingDocument,
    history: interaction.history,
    selectedType: interaction.selectedType,
    session: interaction.session,
    stickies: interaction.workingDocument.stickies,
    hasUndo: StickyInteraction.hasUndo(interaction),
    hasRedo: StickyInteraction.hasRedo(interaction),
    selectType: (type) => {
      setInteraction((current) => StickyInteraction.selectType(current, type));
    },
    select: (stickyId) => {
      setInteraction((current) => StickyInteraction.select(current, stickyId));
    },
    clickAt: (point) => {
      setInteraction((current) => StickyInteraction.clickAt(current, point));
    },
    doubleClickAt: (point) => {
      setInteraction((current) =>
        StickyInteraction.doubleClickAt(current, point),
      );
    },
    changeDraft: (draftText) => {
      setInteraction((current) =>
        StickyInteraction.changeDraft(current, draftText),
      );
    },
    commitEdit: () => {
      setInteraction(StickyInteraction.commitEdit);
    },
    beginDrag: (stickyId, point) => {
      setInteraction((current) =>
        StickyInteraction.beginDrag(current, stickyId, point),
      );
    },
    beginResize: (corner, point) => {
      setInteraction((current) =>
        StickyInteraction.beginResize(current, corner, point),
      );
    },
    movePointer: (point) => {
      setInteraction((current) =>
        StickyInteraction.movePointer(current, point),
      );
    },
    commitManipulation: () => {
      setInteraction(StickyInteraction.commitManipulation);
    },
    cancelManipulation: () => {
      setInteraction(StickyInteraction.cancelManipulation);
    },
    pressEnter: () => {
      setInteraction(StickyInteraction.pressEnter);
    },
    pressEscape: () => {
      setInteraction(StickyInteraction.pressEscape);
    },
    undo: () => {
      setInteraction(StickyInteraction.undo);
    },
    redo: () => {
      setInteraction(StickyInteraction.redo);
    },
  };
}

/** 付箋操作に接続の作成・選択・編集・削除を加えたキャンバス操作。 */
export type UseConnectionInteractionsResult = UseStickyInteractionsResult &
  Readonly<{
    draftHistory: History | undefined;
    connections: readonly Connection[];
    connectionSession: ConnectionSession;
    connectionError: Option<CanvasError>;
    selectAt: (point: Point) => void;
    beginConnectionDrag: (
      endpoint: Readonly<{ stickyId: StickyId; anchor: Anchor }>,
    ) => void;
    moveConnectionDrag: (point: Point) => void;
    finishConnectionDrag: (point: Point) => void;
    cancelConnectionDrag: () => void;
    toggleConnectionMode: () => void;
    selectConnectionEndpoint: (stickyId: StickyId) => void;
    selectConnection: (connectionId: ConnectionId) => void;
    editConnection: (connectionId: ConnectionId) => void;
    changeConnectionDraft: (draftLabel: string) => void;
    commitConnectionEdit: () => void;
    pressDelete: () => void;
    copy: () => void;
    paste: () => void;
    bringToFront: () => void;
    changeViewport: (change: (current: Viewport) => Viewport) => void;
  }>;

/**
 * 付箋と接続が同じ文書・undo履歴を共有するキャンバス操作を扱う。
 *
 * @param initialDocument 初期文書。省略時は空の文書。
 * @param initialHistory 引き継ぐ履歴。指定時は初期文書より優先。
 * @param notifications 編集中の下書きと確定履歴の同期通知。
 * @returns 表示する文書、操作状態、イベントハンドラ。
 */
export function useConnectionInteractions(
  initialDocument?: Document,
  initialHistory?: History,
  notifications: Readonly<{
    onDraftHistoryChange?: (history: History | undefined) => void;
    onHistoryChange?: (history: History) => void;
  }> = {},
): UseConnectionInteractionsResult {
  const [interaction, setInteraction] = useState(() =>
    initialHistory === undefined
      ? ConnectionInteraction.create(initialDocument)
      : ConnectionInteraction.fromHistory(initialHistory),
  );
  const interactionRef = useRef(interaction);
  interactionRef.current = interaction;
  const replaceInteraction = (
    advance: (current: typeof interaction) => typeof interaction,
    publishDraft = false,
  ): void => {
    const current = interactionRef.current;
    const next = advance(current);
    interactionRef.current = next;
    setInteraction(next);
    if (next.board.history !== current.board.history) {
      notifications.onHistoryChange?.(next.board.history);
    }
    if (publishDraft) {
      const pending = ConnectionInteraction.draftHistory(next);
      notifications.onDraftHistoryChange?.(
        pending.some ? pending.value : undefined,
      );
    }
  };
  const board = interaction.board;
  const draftHistory = useMemo(() => {
    const pending = ConnectionInteraction.draftHistory(interaction);
    return pending.some ? pending.value : undefined;
  }, [interaction]);
  const updateBoard = (
    advance: (current: typeof board) => typeof board,
  ): void => {
    replaceInteraction((current) => {
      const nextBoard = advance(current.board);
      return nextBoard === current.board
        ? current
        : ConnectionInteraction.withBoard(current, nextBoard);
    });
  };

  return {
    document: board.workingDocument,
    history: board.history,
    selectedType: board.selectedType,
    session: board.session,
    stickies: board.workingDocument.stickies,
    connections: board.workingDocument.connections,
    draftHistory,
    connectionSession: interaction.session,
    connectionError: interaction.error,
    hasUndo: StickyInteraction.hasUndo(board),
    hasRedo: StickyInteraction.hasRedo(board),
    selectType: (type) => {
      updateBoard((current) => StickyInteraction.selectType(current, type));
    },
    select: (stickyId) => {
      updateBoard((current) => StickyInteraction.select(current, stickyId));
    },
    clickAt: (point) => {
      replaceInteraction((current) =>
        ConnectionInteraction.clickAt(current, point),
      );
    },
    doubleClickAt: (point) => {
      replaceInteraction((current) => {
        if (ConnectionSession.isCreating(current.session)) {
          return current;
        }
        return ConnectionInteraction.withBoard(
          current,
          StickyInteraction.doubleClickAt(current.board, point),
        );
      });
    },
    changeDraft: (draftText) => {
      replaceInteraction(
        (current) =>
          ConnectionInteraction.withBoard(
            current,
            StickyInteraction.changeDraft(current.board, draftText),
          ),
        true,
      );
    },
    commitEdit: () => {
      updateBoard(StickyInteraction.commitEdit);
    },
    beginDrag: (stickyId, point) => {
      updateBoard((current) =>
        StickyInteraction.beginDrag(current, stickyId, point),
      );
    },
    beginResize: (corner, point) => {
      updateBoard((current) =>
        StickyInteraction.beginResize(current, corner, point),
      );
    },
    movePointer: (point) => {
      updateBoard((current) => StickyInteraction.movePointer(current, point));
    },
    commitManipulation: () => {
      updateBoard(StickyInteraction.commitManipulation);
    },
    cancelManipulation: () => {
      updateBoard(StickyInteraction.cancelManipulation);
    },
    pressEnter: () => {
      replaceInteraction(ConnectionInteraction.pressEnter);
    },
    pressEscape: () => {
      replaceInteraction(ConnectionInteraction.pressEscape);
    },
    undo: () => {
      replaceInteraction(ConnectionInteraction.undo);
    },
    redo: () => {
      replaceInteraction(ConnectionInteraction.redo);
    },
    selectAt: (point) =>
      replaceInteraction((current) =>
        ConnectionInteraction.selectAt(current, point),
      ),
    beginConnectionDrag: (endpoint) =>
      replaceInteraction((current) =>
        ConnectionInteraction.beginConnectionDrag(current, endpoint),
      ),
    moveConnectionDrag: (point) =>
      replaceInteraction((current) =>
        ConnectionInteraction.moveConnectionDrag(current, point),
      ),
    finishConnectionDrag: (point) =>
      replaceInteraction((current) =>
        ConnectionInteraction.finishConnectionDrag(current, point),
      ),
    cancelConnectionDrag: () =>
      replaceInteraction(ConnectionInteraction.cancelConnectionDrag),
    toggleConnectionMode: () => {
      replaceInteraction(ConnectionInteraction.toggleMode);
    },
    selectConnectionEndpoint: (stickyId) => {
      replaceInteraction((current) =>
        ConnectionInteraction.selectEndpoint(current, stickyId),
      );
    },
    selectConnection: (connectionId) => {
      replaceInteraction((current) =>
        ConnectionInteraction.select(current, connectionId),
      );
    },
    editConnection: (connectionId) => {
      replaceInteraction((current) =>
        ConnectionInteraction.edit(current, connectionId),
      );
    },
    changeConnectionDraft: (draftLabel) => {
      replaceInteraction(
        (current) => ConnectionInteraction.changeDraft(current, draftLabel),
        true,
      );
    },
    commitConnectionEdit: () => {
      replaceInteraction(ConnectionInteraction.commitEdit);
    },
    copy: () => {
      updateBoard(StickyInteraction.copy);
    },
    paste: () => {
      updateBoard(StickyInteraction.paste);
    },
    bringToFront: () => {
      updateBoard(StickyInteraction.bringToFront);
    },
    pressDelete: () => {
      replaceInteraction(ConnectionInteraction.pressDelete);
    },
    changeViewport: (change) => {
      replaceInteraction((current) => ({
        ...current,
        board: StickyInteraction.changeViewport(
          current.board,
          change(current.board.workingDocument.viewport),
        ),
      }));
    },
  };
}

export {
  useViewportInteractions,
  type UseViewportInteractionsResult,
  type ViewportSurfaceInteraction,
} from "./use-viewport-interactions";
export { useCanvasSurface } from "./use-canvas-surface";
