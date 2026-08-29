import { useState } from "react";
import type {
  Document,
  Point,
  Sticky,
  StickyId,
  StickyType,
} from "@domain-modeler/canvas-core";
import {
  StickyInteraction,
  type StickyResizeCorner,
  type StickySession,
} from "../domains/sticky-interaction";

/** 付箋の作成・選択・編集操作。 */
export type UseStickyInteractionsResult = Readonly<{
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
