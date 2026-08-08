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

/** 文書の現在値と undo / redo のコマンド履歴を保持する。 */
export interface History {
  readonly current: Document;
  readonly undoStack: CommandStack;
  readonly redoStack: CommandStack;
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
    undoStack: CommandStackValue.empty(),
    redoStack: CommandStackValue.empty(),
  }),
  /**
   * 文書コマンドを実行して履歴へ記録する。
   * ドラッグ・リサイズ・編集セッションなどの連続操作は、中間状態を積まず確定時に1コマンドだけ渡す。
   * viewport 変更・選択状態はコマンド化しない。
   * @param history コマンド実行前の履歴。
   * @param command 実行する文書コマンド。
   * @returns 逆操作を undo stackへ積み、redo stackを空にした履歴。
   */
  execute: (history: History, command: DocumentCommand): History => ({
    current: DocumentCommandValue.execute(command, history.current),
    undoStack: CommandStackValue.push(
      history.undoStack,
      DocumentCommandValue.inverse(command),
    ),
    redoStack: CommandStackValue.empty(),
  }),
  /**
   * 直前の文書コマンドを逆操作で取り消す。
   * @param history undo 前の履歴。
   * @returns 逆操作を実行して、再実行コマンドをredo stackへ積んだ履歴。取り消せるコマンドがない場合は値なし。
   */
  undo: (history: History): Option<History> => {
    const popped = CommandStackValue.pop(history.undoStack);
    if (!popped.some) {
      return OptionValue.none();
    }
    return OptionValue.some({
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
   * @param history redo 前の履歴。
   * @returns コマンドを実行して、その逆操作をundo stackへ積んだ履歴。再実行できるコマンドがない場合は値なし。
   */
  redo: (history: History): Option<History> => {
    const popped = CommandStackValue.pop(history.redoStack);
    if (!popped.some) {
      return OptionValue.none();
    }
    return OptionValue.some({
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
};
