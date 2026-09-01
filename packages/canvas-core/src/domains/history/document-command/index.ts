import type { Connection } from "../../connection";
import type { Document } from "../../document";

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

/** 文書全体を置換するコマンド。 */
export interface ReplaceDocumentCommand {
  readonly type: "replace_document";
  readonly previous: Document;
  readonly next: Document;
}

/** 文書全体置換コマンドを生成、実行する関数群。 */
export const ReplaceDocumentCommand = {
  /**
   * 置換前後の文書からコマンドを生成する。
   * @param documents 置換前後の文書。
   * @returns 文書全体置換コマンド。
   */
  create: (documents: {
    readonly previous: Document;
    readonly next: Document;
  }): ReplaceDocumentCommand => ({ type: "replace_document", ...documents }),
  /**
   * 文書全体を next で置き換える。
   * @param command 実行する文書全体置換コマンド。
   * @param _document 変更前の文書（next で置換するため未使用）。
   * @returns 置換後の文書。
   */
  execute: (
    command: ReplaceDocumentCommand,
    _document: Document,
  ): Document => command.next,
} as const;

/** 履歴へ保存できる文書コマンド。 */
export type DocumentCommand =
  | ChangeTitleCommand
  | AddConnectionCommand
  | RemoveConnectionCommand
  | ReplaceDocumentCommand;

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
      case "replace_document":
        return ReplaceDocumentCommand.execute(command, document);
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
      case "replace_document":
        return ReplaceDocumentCommand.create({
          previous: command.next,
          next: command.previous,
        });
    }
  },
} as const;
