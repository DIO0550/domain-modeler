import type { Document } from "./document";
import { type Option, Option as OptionValue } from "./option";

const HISTORY_LIMIT = 100;

/** 文書へ適用でき、逆操作を生成できるコマンド。 */
export interface DocumentCommand {
  /**
   * 文書へコマンドを適用する。
   * @param document コマンド実行前の文書。
   * @returns コマンド実行後の文書。
   */
  readonly execute: (document: Document) => Document;
  /**
   * コマンドと反対の変更を行うコマンドを生成する。
   * @returns 逆操作を行うコマンド。
   */
  readonly inverse: () => DocumentCommand;
}

/** 文書コマンドを生成する関数群。 */
export const DocumentCommand = {
  /**
   * 実行処理と逆操作から文書コマンドを生成する。
   * @param command 文書へ適用する実行処理と逆操作。
   * @returns 生成した文書コマンド。
   */
  create: (command: DocumentCommand): DocumentCommand => command,
} as const;

/** 文書の現在値と undo / redo のコマンド履歴を保持する。 */
export interface History {
  readonly current: Document;
  readonly undoStack: readonly DocumentCommand[];
  readonly redoStack: readonly DocumentCommand[];
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
   * 文書コマンドを実行して履歴へ記録する。
   * @param history コマンド実行前の履歴。
   * @param command 実行する文書コマンド。
   * @returns 逆操作を undo stackへ積み、redo stackを空にした履歴。
   */
  execute: (history: History, command: DocumentCommand): History => ({
    current: command.execute(history.current),
    undoStack: [...history.undoStack, command.inverse()].slice(-HISTORY_LIMIT),
    redoStack: [],
  }),
  /**
   * 直前の文書コマンドを逆操作で取り消す。
   * @param history undo 前の履歴。
   * @returns 逆操作を実行して、再実行コマンドをredo stackへ積んだ履歴。取り消せるコマンドがない場合は値なし。
   */
  undo: (history: History): Option<History> => {
    const command = history.undoStack[history.undoStack.length - 1];
    if (command === undefined) {
      return OptionValue.none();
    }
    return OptionValue.some({
      current: command.execute(history.current),
      undoStack: history.undoStack.slice(0, -1),
      redoStack: [...history.redoStack, command.inverse()],
    });
  },
  /**
   * 取り消した文書コマンドを再実行する。
   * @param history redo 前の履歴。
   * @returns コマンドを実行して、その逆操作をundo stackへ積んだ履歴。再実行できるコマンドがない場合は値なし。
   */
  redo: (history: History): Option<History> => {
    const command = history.redoStack[history.redoStack.length - 1];
    if (command === undefined) {
      return OptionValue.none();
    }
    return OptionValue.some({
      current: command.execute(history.current),
      undoStack: [...history.undoStack, command.inverse()],
      redoStack: history.redoStack.slice(0, -1),
    });
  },
};
