import type { Document } from "../document";
import { type Option, Option as OptionValue } from "../option";
import {
  type CommandStack,
  CommandStack as CommandStackValue,
} from "./command-stack";
import {
  type DocumentCommand,
  DocumentCommand as DocumentCommandValue,
} from "./document-command";

export * from "./command-stack";
export * from "./document-command";

/** トランザクション外の履歴状態。 */
export interface IdleHistory {
  readonly status: "idle";
  readonly current: Document;
  readonly undoStack: CommandStack;
  readonly redoStack: CommandStack;
}

/** 連続操作の開始〜確定のあいだの履歴状態。 */
export interface TransactionHistory {
  readonly status: "transaction";
  readonly current: Document;
  readonly undoStack: CommandStack;
  readonly redoStack: CommandStack;
}

/** 文書の現在値と undo / redo のコマンド履歴を保持する。 */
export type History = IdleHistory | TransactionHistory;

/** 文書の履歴を生成、更新する関数群。 */
export const History = {
  /**
   * 文書を現在値とする空の履歴を生成する。
   * @param document 履歴の初期文書。
   * @returns undo / redo 対象を持たない idle 履歴。
   */
  create: (document: Document): IdleHistory => ({
    status: "idle",
    current: document,
    undoStack: CommandStackValue.empty(),
    redoStack: CommandStackValue.empty(),
  }),
  /**
   * 文書コマンドを実行して履歴へ記録する。
   * @param history コマンド実行前の idle 履歴。
   * @param command 実行する文書コマンド。
   * @returns 逆操作を undo stackへ積み、redo stackを空にした idle 履歴。
   */
  execute: (history: IdleHistory, command: DocumentCommand): IdleHistory => ({
    status: "idle",
    current: DocumentCommandValue.execute(command, history.current),
    undoStack: CommandStackValue.push(
      history.undoStack,
      DocumentCommandValue.inverse(command),
    ),
    redoStack: CommandStackValue.empty(),
  }),
  /**
   * 直前の文書コマンドを逆操作で取り消す。
   * @param history undo 前の idle 履歴。
   * @returns 逆操作を実行して、再実行コマンドをredo stackへ積んだ idle 履歴。取り消せるコマンドがない場合は値なし。
   */
  undo: (history: IdleHistory): Option<IdleHistory> => {
    const popped = CommandStackValue.pop(history.undoStack);
    if (!popped.some) {
      return OptionValue.none();
    }
    return OptionValue.some({
      status: "idle",
      current: DocumentCommandValue.execute(
        popped.value.command,
        history.current,
      ),
      undoStack: popped.value.remaining,
      redoStack: CommandStackValue.push(
        history.redoStack,
        DocumentCommandValue.inverse(popped.value.command),
      ),
    });
  },
  /**
   * 取り消した文書コマンドを再実行する。
   * @param history redo 前の idle 履歴。
   * @returns コマンドを実行して、その逆操作をundo stackへ積んだ idle 履歴。再実行できるコマンドがない場合は値なし。
   */
  redo: (history: IdleHistory): Option<IdleHistory> => {
    const popped = CommandStackValue.pop(history.redoStack);
    if (!popped.some) {
      return OptionValue.none();
    }
    return OptionValue.some({
      status: "idle",
      current: DocumentCommandValue.execute(
        popped.value.command,
        history.current,
      ),
      undoStack: CommandStackValue.push(
        history.undoStack,
        DocumentCommandValue.inverse(popped.value.command),
      ),
      redoStack: popped.value.remaining,
    });
  },
  /**
   * 連続操作の開始として、トランザクション中の履歴へ切り替える。
   * @param history 連続操作を始める前の idle 履歴。
   * @returns スタックを引き継いだトランザクション中の履歴。
   */
  begin: (history: IdleHistory): TransactionHistory => ({
    status: "transaction",
    current: history.current,
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
   * 連続操作を確定し、呼び出し側が渡した1コマンドを履歴へ積む。
   * @param history 確定するトランザクション中の履歴。
   * @param command 確定内容を表す文書コマンド。
   * @returns 逆操作を undo stackへ積み、redo stackを空にした idle 履歴。
   */
  commit: (
    history: TransactionHistory,
    command: DocumentCommand,
  ): IdleHistory => ({
    status: "idle",
    current: history.current,
    undoStack: CommandStackValue.push(
      history.undoStack,
      DocumentCommandValue.inverse(command),
    ),
    redoStack: CommandStackValue.empty(),
  }),
};
