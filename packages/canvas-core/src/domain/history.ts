import type { Document } from "./document";
import { type Option, Option as OptionValue } from "./option";

const HISTORY_LIMIT = 100;

/** 文書へ適用された1回の操作。 */
export interface DocumentOperation {
  readonly previous: Document;
  readonly next: Document;
}

/** 文書操作を生成し、適用状態を切り替える関数群。 */
export const DocumentOperation = {
  /**
   * 操作前後の文書から文書操作を生成する。
   * @param documents 操作前後の文書。
   * @returns 生成した文書操作。
   */
  create: (documents: {
    readonly previous: Document;
    readonly next: Document;
  }): DocumentOperation => documents,
  /**
   * 文書操作を取り消した状態の文書を取得する。
   * @param operation 取り消す文書操作。
   * @returns 操作前の文書。
   */
  undo: (operation: DocumentOperation): Document => operation.previous,
  /**
   * 文書操作を適用した状態の文書を取得する。
   * @param operation 適用する文書操作。
   * @returns 操作後の文書。
   */
  redo: (operation: DocumentOperation): Document => operation.next,
} as const;

/** 文書の現在値と undo / redo の編集履歴を保持する。 */
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
   * 確定した編集を履歴へ記録する。
   * @param history 編集前の履歴。
   * @param document 編集後の文書。
   * @returns 文書操作を undo stackへ積み、redo stackを空にした履歴。
   */
  record: (history: History, document: Document): History => ({
    current: document,
    undoStack: [
      ...history.undoStack,
      DocumentOperation.create({ previous: history.current, next: document }),
    ].slice(-HISTORY_LIMIT),
    redoStack: [],
  }),
  /**
   * 直前の編集を取り消す。
   * @param history undo 前の履歴。
   * @returns 編集前の文書へ戻し、対象操作を redo stackへ移した履歴。取り消せる編集がない場合は値なし。
   */
  undo: (history: History): Option<History> => {
    const operation = history.undoStack[history.undoStack.length - 1];
    if (operation === undefined) {
      return OptionValue.none();
    }
    return OptionValue.some({
      current: DocumentOperation.undo(operation),
      undoStack: history.undoStack.slice(0, -1),
      redoStack: [...history.redoStack, operation],
    });
  },
  /**
   * 取り消した編集をやり直す。
   * @param history redo 前の履歴。
   * @returns 編集後の文書へ進め、対象操作を undo stackへ戻した履歴。やり直せる編集がない場合は値なし。
   */
  redo: (history: History): Option<History> => {
    const operation = history.redoStack[history.redoStack.length - 1];
    if (operation === undefined) {
      return OptionValue.none();
    }
    return OptionValue.some({
      current: DocumentOperation.redo(operation),
      undoStack: [...history.undoStack, operation],
      redoStack: history.redoStack.slice(0, -1),
    });
  },
};
