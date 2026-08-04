import type { Document } from "../document";
import { type Option, Option as OptionValue } from "../option";

const HISTORY_LIMIT = 100;

/** 文書へ適用された1回の確定編集。 */
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

/**
 * 表示範囲を現在の値に保った文書へ切り替える。
 * viewport は履歴対象外のため、復元時も呼び出し時点の表示範囲を維持する。
 * @param document 復元する文書。
 * @param viewport 維持する表示範囲。
 * @returns 表示範囲を差し替えた文書。
 */
const withCurrentViewport = (
  document: Document,
  viewport: Document["viewport"],
): Document => ({
  ...document,
  viewport,
});

/** トランザクション外の履歴状態。 */
export interface IdleHistory {
  readonly status: "idle";
  readonly current: Document;
  readonly undoStack: readonly DocumentOperation[];
  readonly redoStack: readonly DocumentOperation[];
}

/** 連続操作の開始〜確定のあいだの履歴状態。 */
export interface TransactionHistory {
  readonly status: "transaction";
  readonly current: Document;
  readonly baseline: Document;
  readonly undoStack: readonly DocumentOperation[];
  readonly redoStack: readonly DocumentOperation[];
}

/** 文書の現在値と undo / redo の編集履歴を保持する。 */
export type History = IdleHistory | TransactionHistory;

/** 文書の履歴を生成、更新する関数群。 */
export const History = {
  /**
   * 文書を現在値とする空の履歴を生成する。
   * @param document 履歴の初期文書。
   * @returns undo / redo 対象を持たない履歴。
   */
  create: (document: Document): IdleHistory => ({
    status: "idle",
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
  record: (history: IdleHistory, document: Document): IdleHistory => ({
    status: "idle",
    current: document,
    undoStack: [
      ...history.undoStack,
      DocumentOperation.create({ previous: history.current, next: document }),
    ].slice(-HISTORY_LIMIT),
    redoStack: [],
  }),
  /**
   * 連続操作の開始として、確定前の基準文書を固定する。
   * @param history 連続操作を始める前の履歴。
   * @returns 基準文書を保持したトランザクション中の履歴。
   */
  begin: (history: IdleHistory): TransactionHistory => ({
    status: "transaction",
    current: history.current,
    baseline: history.current,
    undoStack: history.undoStack,
    redoStack: history.redoStack,
  }),
  /**
   * トランザクション中の中間文書を差し替える。履歴スタックには積まない。
   * @param history トランザクション中の履歴。
   * @param document 差し替える中間文書。
   * @returns 現在文書だけを更新したトランザクション中の履歴。
   */
  replace: (
    history: TransactionHistory,
    document: Document,
  ): TransactionHistory => ({
    ...history,
    current: document,
  }),
  /**
   * 連続操作を確定し、開始時点から確定時点までの変更を1履歴エントリにする。
   * @param history 確定するトランザクション中の履歴。
   * @returns 1操作を undo stackへ積み、redo stackを空にした履歴。
   */
  commit: (history: TransactionHistory): IdleHistory => {
    if (history.baseline === history.current) {
      return {
        status: "idle",
        current: history.current,
        undoStack: history.undoStack,
        redoStack: history.redoStack,
      };
    }
    return {
      status: "idle",
      current: history.current,
      undoStack: [
        ...history.undoStack,
        DocumentOperation.create({
          previous: history.baseline,
          next: history.current,
        }),
      ].slice(-HISTORY_LIMIT),
      redoStack: [],
    };
  },
  /**
   * 直前の編集を取り消す。表示範囲は取り消さず現在値を維持する。
   * @param history undo 前の履歴。
   * @returns 編集前の文書へ戻し、対象操作を redo stackへ移した履歴。取り消せる編集がない場合は値なし。
   */
  undo: (history: IdleHistory): Option<IdleHistory> => {
    const operation = history.undoStack[history.undoStack.length - 1];
    if (operation === undefined) {
      return OptionValue.none();
    }
    return OptionValue.some({
      status: "idle",
      current: withCurrentViewport(
        DocumentOperation.undo(operation),
        history.current.viewport,
      ),
      undoStack: history.undoStack.slice(0, -1),
      redoStack: [...history.redoStack, operation],
    });
  },
  /**
   * 取り消した編集をやり直す。表示範囲はやり直さず現在値を維持する。
   * @param history redo 前の履歴。
   * @returns 編集後の文書へ進め、対象操作を undo stackへ戻した履歴。やり直せる編集がない場合は値なし。
   */
  redo: (history: IdleHistory): Option<IdleHistory> => {
    const operation = history.redoStack[history.redoStack.length - 1];
    if (operation === undefined) {
      return OptionValue.none();
    }
    return OptionValue.some({
      status: "idle",
      current: withCurrentViewport(
        DocumentOperation.redo(operation),
        history.current.viewport,
      ),
      undoStack: [...history.undoStack, operation],
      redoStack: history.redoStack.slice(0, -1),
    });
  },
} as const;
