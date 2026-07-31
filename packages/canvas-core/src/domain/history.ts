import type { Document } from "./document";
import { type Option, Option as OptionValue } from "./option";

const HISTORY_LIMIT = 100;

/** 文書へ適用でき、適用前の状態へ戻せる操作。 */
export interface DocumentOperation {
  /**
   * 文書へ操作を適用する。
   * @param document 操作前の文書。
   * @returns 操作後の文書。
   */
  readonly execute: (document: Document) => Document;
  /**
   * 文書へ適用した操作を取り消す。
   * @param document 操作後の文書。
   * @returns 操作前の文書。
   */
  readonly undo: (document: Document) => Document;
}

/** 文書操作を生成する関数群。 */
export const DocumentOperation = {
  /**
   * 実行処理と取り消し処理から文書操作を生成する。
   * @param operation 文書へ適用する実行処理と取り消し処理。
   * @returns 生成した文書操作。
   */
  create: (operation: DocumentOperation): DocumentOperation => operation,
} as const;

/** 文書の現在値と undo / redo の操作履歴を保持する。 */
export interface History {
  readonly current: Document;
  readonly undoStack: readonly DocumentOperation[];
  readonly redoStack: readonly DocumentOperation[];
}

/** 文書の履歴を生成、更新する関数群。 */
export const History = {
  /**
   * 文書を現在値とする空の履歴を生成する。
   * @param document 履歴の初期文書。
   * @returns undo / redo 対象を持たない履歴。
   */
  create: (document: Document): History => ({
    current: document,
    undoStack: [],
    redoStack: [],
  }),
  /**
   * 文書操作を実行して履歴へ記録する。
   * @param history 操作前の履歴。
   * @param operation 実行する文書操作。
   * @returns 操作を undo stackへ積み、redo stackを空にした履歴。
   */
  execute: (history: History, operation: DocumentOperation): History => ({
    current: operation.execute(history.current),
    undoStack: [...history.undoStack, operation].slice(-HISTORY_LIMIT),
    redoStack: [],
  }),
  /**
   * 直前の文書操作を取り消す。
   * @param history undo 前の履歴。
   * @returns 操作を取り消してredo stackへ移した履歴。取り消せる操作がない場合は値なし。
   */
  undo: (history: History): Option<History> => {
    const operation = history.undoStack[history.undoStack.length - 1];
    if (operation === undefined) {
      return OptionValue.none();
    }
    return OptionValue.some({
      current: operation.undo(history.current),
      undoStack: history.undoStack.slice(0, -1),
      redoStack: [...history.redoStack, operation],
    });
  },
  /**
   * 取り消した文書操作を再実行する。
   * @param history redo 前の履歴。
   * @returns 操作を再実行してundo stackへ戻した履歴。再実行できる操作がない場合は値なし。
   */
  redo: (history: History): Option<History> => {
    const operation = history.redoStack[history.redoStack.length - 1];
    if (operation === undefined) {
      return OptionValue.none();
    }
    return OptionValue.some({
      current: operation.execute(history.current),
      undoStack: [...history.undoStack, operation],
      redoStack: history.redoStack.slice(0, -1),
    });
  },
};
