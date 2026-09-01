import { useState } from "react";
import type {
  CanvasError,
  Connection,
  ConnectionId,
  Document,
  Option,
  Point,
  Sticky,
  StickyId,
  StickyType,
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
    connections: readonly Connection[];
    connectionSession: ConnectionSession;
    connectionError: Option<CanvasError>;
    toggleConnectionMode: () => void;
    selectConnection: (connectionId: ConnectionId) => void;
    editConnection: (connectionId: ConnectionId) => void;
    changeConnectionDraft: (draftLabel: string) => void;
    commitConnectionEdit: () => void;
    pressDelete: () => void;
  }>;

/**
 * 付箋と接続が同じ文書・undo履歴を共有するキャンバス操作を扱う。
 *
 * @param initialDocument 初期文書。省略時は空の文書。
 * @returns 表示する文書、操作状態、イベントハンドラ。
 */
export function useConnectionInteractions(
  initialDocument?: Document,
): UseConnectionInteractionsResult {
  const [interaction, setInteraction] = useState(() =>
    ConnectionInteraction.create(initialDocument),
  );
  const board = interaction.board;
  const updateBoard = (
    advance: (current: typeof board) => typeof board,
  ): void => {
    setInteraction((current) =>
      ConnectionInteraction.withBoard(current, advance(current.board)),
    );
  };

  return {
    document: board.workingDocument,
    selectedType: board.selectedType,
    session: board.session,
    stickies: board.workingDocument.stickies,
    connections: board.workingDocument.connections,
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
      setInteraction((current) => ConnectionInteraction.clickAt(current, point));
    },
    doubleClickAt: (point) => {
      setInteraction((current) => {
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
      updateBoard((current) =>
        StickyInteraction.changeDraft(current, draftText),
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
      setInteraction(ConnectionInteraction.pressEnter);
    },
    pressEscape: () => {
      setInteraction(ConnectionInteraction.pressEscape);
    },
    undo: () => {
      setInteraction(ConnectionInteraction.undo);
    },
    redo: () => {
      setInteraction(ConnectionInteraction.redo);
    },
    toggleConnectionMode: () => {
      setInteraction(ConnectionInteraction.toggleMode);
    },
    selectConnection: (connectionId) => {
      setInteraction((current) =>
        ConnectionInteraction.select(current, connectionId),
      );
    },
    editConnection: (connectionId) => {
      setInteraction((current) =>
        ConnectionInteraction.edit(current, connectionId),
      );
    },
    changeConnectionDraft: (draftLabel) => {
      setInteraction((current) =>
        ConnectionInteraction.changeDraft(current, draftLabel),
      );
    },
    commitConnectionEdit: () => {
      setInteraction(ConnectionInteraction.commitEdit);
    },
    pressDelete: () => {
      setInteraction(ConnectionInteraction.pressDelete);
    },
  };
}
