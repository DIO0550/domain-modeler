import type { Document } from "./document";
import type { Connection } from "./connection";
import { type Option, Option as OptionValue } from "./option";

const HISTORY_LIMIT = 100;

/** 文書タイトルを変更するコマンド。 */
export interface ChangeTitleCommand {
  readonly type: "change_title";
  readonly previous: string;
  readonly next: string;
}

/** 文書タイトル変更コマンドを生成、実行する関数群。 */
export const ChangeTitleCommand = {
  /**
   * 変更前後のタイトルからコマンドを生成する。
   * @param titles 変更前後のタイトル。
   * @returns タイトル変更コマンド。
   */
  create: (titles: {
    readonly previous: string;
    readonly next: string;
  }): ChangeTitleCommand => ({ type: "change_title", ...titles }),
  /**
   * 文書タイトルを変更する。
   * @param command 実行するタイトル変更コマンド。
   * @param document 変更前の文書。
   * @returns タイトルを変更した文書。
   */
  execute: (command: ChangeTitleCommand, document: Document): Document => ({
    ...document,
    title: command.next,
  }),
} as const;

/** 文書へ接続を追加するコマンド。 */
export interface AddConnectionCommand {
  readonly type: "add_connection";
  readonly connection: Connection;
}

/** 接続追加コマンドを生成、実行する関数群。 */
export const AddConnectionCommand = {
  /**
   * 追加する接続からコマンドを生成する。
   * @param connection 追加する接続。
   * @returns 接続追加コマンド。
   */
  create: (connection: Connection): AddConnectionCommand => ({
    type: "add_connection",
    connection,
  }),
  /**
   * 文書へ接続を追加する。
   * @param command 実行する接続追加コマンド。
   * @param document 追加前の文書。
   * @returns 接続を追加した文書。
   */
  execute: (command: AddConnectionCommand, document: Document): Document => ({
    ...document,
    connections: [...document.connections, command.connection],
  }),
} as const;

/** 文書から接続を削除するコマンド。 */
export interface RemoveConnectionCommand {
  readonly type: "remove_connection";
  readonly connection: Connection;
}

/** 接続削除コマンドを生成、実行する関数群。 */
export const RemoveConnectionCommand = {
  /**
   * 削除する接続からコマンドを生成する。
   * @param connection 削除する接続。
   * @returns 接続削除コマンド。
   */
  create: (connection: Connection): RemoveConnectionCommand => ({
    type: "remove_connection",
    connection,
  }),
  /**
   * 文書から接続を削除する。
   * @param command 実行する接続削除コマンド。
   * @param document 削除前の文書。
   * @returns 接続を削除した文書。
   */
  execute: (
    command: RemoveConnectionCommand,
    document: Document,
  ): Document => ({
    ...document,
    connections: document.connections.filter(
      (connection) => connection.id !== command.connection.id,
    ),
  }),
} as const;

/** 履歴へ保存できる文書コマンド。 */
export type DocumentCommand =
  | ChangeTitleCommand
  | AddConnectionCommand
  | RemoveConnectionCommand;

/** 文書コマンドを実行し、逆コマンドへ変換する関数群。 */
export const DocumentCommand = {
  /**
   * 文書コマンドを実行する。
   * @param command 実行する文書コマンド。
   * @param document コマンド実行前の文書。
   * @returns コマンド実行後の文書。
   */
  execute: (command: DocumentCommand, document: Document): Document => {
    switch (command.type) {
      case "change_title":
        return ChangeTitleCommand.execute(command, document);
      case "add_connection":
        return AddConnectionCommand.execute(command, document);
      case "remove_connection":
        return RemoveConnectionCommand.execute(command, document);
    }
  },
  /**
   * 文書コマンドを逆コマンドへ変換する。
   * @param command 変換する文書コマンド。
   * @returns 反対の変更を行う文書コマンド。
   */
  inverse: (command: DocumentCommand): DocumentCommand => {
    switch (command.type) {
      case "change_title":
        return ChangeTitleCommand.create({
          previous: command.next,
          next: command.previous,
        });
      case "add_connection":
        return RemoveConnectionCommand.create(command.connection);
      case "remove_connection":
        return AddConnectionCommand.create(command.connection);
    }
  },
} as const;

/** 文書コマンドを後入れ先出しで保持するスタック。 */
export type CommandStack = readonly DocumentCommand[];

/** 文書コマンドスタックを生成、更新する関数群。 */
export const CommandStack = {
  /**
   * 空の文書コマンドスタックを生成する。
   * @returns コマンドを持たないスタック。
   */
  empty: (): CommandStack => [],
  /**
   * 文書コマンドをスタックの末尾へ積む。
   * @param stack コマンドを積む前のスタック。
   * @param command 積む文書コマンド。
   * @returns コマンドを積み、上限を超えた古いコマンドを破棄したスタック。
   */
  push: (stack: CommandStack, command: DocumentCommand): CommandStack =>
    [...stack, command].slice(-HISTORY_LIMIT),
  /**
   * スタックの末尾から文書コマンドを取り出す。
   * @param stack コマンドを取り出すスタック。
   * @returns 取り出したコマンドと残りのスタック。空の場合は値なし。
   */
  pop: (
    stack: CommandStack,
  ): Option<Readonly<{ command: DocumentCommand; remaining: CommandStack }>> => {
    const command = stack[stack.length - 1];
    return command === undefined
      ? OptionValue.none()
      : OptionValue.some({ command, remaining: stack.slice(0, -1) });
  },
} as const;

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
    undoStack: CommandStack.empty(),
    redoStack: CommandStack.empty(),
  }),
  /**
   * 文書コマンドを実行して履歴へ記録する。
   * @param history コマンド実行前の履歴。
   * @param command 実行する文書コマンド。
   * @returns 逆操作を undo stackへ積み、redo stackを空にした履歴。
   */
  execute: (history: History, command: DocumentCommand): History => ({
    current: DocumentCommand.execute(command, history.current),
    undoStack: CommandStack.push(
      history.undoStack,
      DocumentCommand.inverse(command),
    ),
    redoStack: CommandStack.empty(),
  }),
  /**
   * 直前の文書コマンドを逆操作で取り消す。
   * @param history undo 前の履歴。
   * @returns 逆操作を実行して、再実行コマンドをredo stackへ積んだ履歴。取り消せるコマンドがない場合は値なし。
   */
  undo: (history: History): Option<History> => {
    const popped = CommandStack.pop(history.undoStack);
    if (!popped.some) {
      return OptionValue.none();
    }
    return OptionValue.some({
      current: DocumentCommand.execute(popped.value.command, history.current),
      undoStack: popped.value.remaining,
      redoStack: CommandStack.push(
        history.redoStack,
        DocumentCommand.inverse(popped.value.command),
      ),
    });
  },
  /**
   * 取り消した文書コマンドを再実行する。
   * @param history redo 前の履歴。
   * @returns コマンドを実行して、その逆操作をundo stackへ積んだ履歴。再実行できるコマンドがない場合は値なし。
   */
  redo: (history: History): Option<History> => {
    const popped = CommandStack.pop(history.redoStack);
    if (!popped.some) {
      return OptionValue.none();
    }
    return OptionValue.some({
      current: DocumentCommand.execute(popped.value.command, history.current),
      undoStack: CommandStack.push(
        history.undoStack,
        DocumentCommand.inverse(popped.value.command),
      ),
      redoStack: popped.value.remaining,
    });
  },
};
