import {
  type CanvasError,
  type ConnectionId,
  Document,
  History,
  type Option,
  Option as OptionValue,
  type Point,
  ReplaceDocumentCommand,
  type StickyId,
} from "@domain-modeler/canvas-core";
import {
  type StickyInteraction,
  StickyInteraction as StickyInteractionValue,
} from "../sticky-interaction";
import { ConnectionSession } from "../connection-session";

/** 付箋操作と同じ文書・履歴を使う接続操作。 */
export type ConnectionInteraction = Readonly<{
  board: StickyInteraction;
  session: ConnectionSession;
  error: Option<CanvasError>;
}>;

/** 接続の作成、選択、ラベル編集、削除を進める関数群。 */
export const ConnectionInteraction = {
  /**
   * 文書から接続操作を生成する。
   *
   * @param document 初期文書。
   * @returns 付箋と接続の選択がない操作状態。
   */
  create(document?: Document): ConnectionInteraction {
    return {
      board: StickyInteractionValue.create(document),
      session: { status: "idle" },
      error: OptionValue.none(),
    };
  },

  /**
   * 付箋操作後の状態を取り込み、接続の選択とエラーを解除する。
   *
   * @param interaction 変更前の接続操作。
   * @param board 付箋操作後の状態。
   * @returns 付箋操作を反映した接続操作。
   */
  withBoard(
    interaction: ConnectionInteraction,
    board: StickyInteraction,
  ): ConnectionInteraction {
    return {
      ...interaction,
      board,
      session: { status: "idle" },
      error: OptionValue.none(),
    };
  },

  /**
   * 接続作成モードを開始または終了する。
   *
   * @param interaction 切り替え前の操作状態。
   * @returns 開始時は始点選択、終了時は未操作の状態。
   */
  toggleMode(interaction: ConnectionInteraction): ConnectionInteraction {
    if (ConnectionSession.isCreating(interaction.session)) {
      return {
        ...interaction,
        session: { status: "idle" },
        error: OptionValue.none(),
      };
    }
    return {
      board: StickyInteractionValue.deselect(interaction.board),
      session: { status: "selectingSource" },
      error: OptionValue.none(),
    };
  },

  /**
   * キャンバス上のクリックを接続作成または付箋操作として解釈する。
   *
   * @param interaction クリック前の操作状態。
   * @param point ワールド座標のクリック位置。
   * @returns 接続の端点選択、または付箋操作後の状態。
   */
  clickAt(
    interaction: ConnectionInteraction,
    point: Point,
  ): ConnectionInteraction {
    if (!ConnectionSession.isCreating(interaction.session)) {
      return ConnectionInteraction.withBoard(
        interaction,
        StickyInteractionValue.clickAt(interaction.board, point),
      );
    }
    const sticky = Document.stickyAt(interaction.board.workingDocument, point);
    return sticky.some
      ? ConnectionInteraction.selectEndpoint(interaction, sticky.value.id)
      : interaction;
  },

  /**
   * 接続作成モードで始点または終点を選択する。
   *
   * @param interaction 選択前の操作状態。
   * @param stickyId 選択した付箋 ID。
   * @returns 始点選択後、接続作成後、または core エラーを保持した状態。
   */
  selectEndpoint(
    interaction: ConnectionInteraction,
    stickyId: StickyId,
  ): ConnectionInteraction {
    if (interaction.session.status === "selectingSource") {
      return {
        ...interaction,
        session: { status: "selectingTarget", sourceId: stickyId },
        error: OptionValue.none(),
      };
    }
    if (interaction.session.status !== "selectingTarget") {
      return interaction;
    }
    const added = Document.addConnection(
      interaction.board.workingDocument,
      interaction.session.sourceId,
      stickyId,
    );
    if (!added.ok) {
      return { ...interaction, error: OptionValue.some(added.error) };
    }
    const connection =
      added.value.connections[added.value.connections.length - 1];
    if (connection === undefined) {
      return interaction;
    }
    return {
      board: executeDocumentChange(interaction.board, added.value),
      session: { status: "selected", connectionId: connection.id },
      error: OptionValue.none(),
    };
  },

  /**
   * 指定した接続を選択する。
   *
   * @param interaction 選択前の操作状態。
   * @param connectionId 選択する接続 ID。
   * @returns 接続選択後の状態。接続が無ければ入力を返す。
   */
  select(
    interaction: ConnectionInteraction,
    connectionId: ConnectionId,
  ): ConnectionInteraction {
    const connection = Document.connectionById(
      interaction.board.workingDocument,
      connectionId,
    );
    if (!connection.some) {
      return interaction;
    }
    return {
      board: StickyInteractionValue.deselect(interaction.board),
      session: { status: "selected", connectionId },
      error: OptionValue.none(),
    };
  },

  /**
   * 指定した接続のラベル編集を始める。
   *
   * @param interaction 編集前の操作状態。
   * @param connectionId 編集する接続 ID。
   * @returns 現在のラベルを下書きにした編集状態。
   */
  edit(
    interaction: ConnectionInteraction,
    connectionId: ConnectionId,
  ): ConnectionInteraction {
    const connection = Document.connectionById(
      interaction.board.workingDocument,
      connectionId,
    );
    if (!connection.some) {
      return interaction;
    }
    return {
      board: StickyInteractionValue.deselect(interaction.board),
      session: {
        status: "editing",
        connectionId,
        draftLabel: connection.value.label,
        originalLabel: connection.value.label,
      },
      error: OptionValue.none(),
    };
  },

  /**
   * 編集中のラベル下書きを変更する。
   *
   * @param interaction 変更前の操作状態。
   * @param draftLabel 次の下書き。
   * @returns 下書きを更新した状態。編集中でなければ入力を返す。
   */
  changeDraft(
    interaction: ConnectionInteraction,
    draftLabel: string,
  ): ConnectionInteraction {
    if (interaction.session.status !== "editing") {
      return interaction;
    }
    return {
      ...interaction,
      session: { ...interaction.session, draftLabel },
    };
  },

  /**
   * ラベル編集を確定し、変更があれば履歴へ1エントリ積む。
   *
   * @param interaction 確定前の操作状態。
   * @returns 接続選択へ戻した状態。
   */
  commitEdit(interaction: ConnectionInteraction): ConnectionInteraction {
    if (interaction.session.status !== "editing") {
      return interaction;
    }
    const selected: ConnectionInteraction = {
      ...interaction,
      session: {
        status: "selected",
        connectionId: interaction.session.connectionId,
      },
    };
    if (interaction.session.draftLabel === interaction.session.originalLabel) {
      return selected;
    }
    const document = Document.updateConnectionLabel(
      interaction.board.workingDocument,
      interaction.session.connectionId,
      interaction.session.draftLabel,
    );
    return {
      ...selected,
      board: executeDocumentChange(interaction.board, document),
    };
  },

  /**
   * Enter を接続または付箋の編集開始として解釈する。
   *
   * @param interaction キー操作前の状態。
   * @returns ラベルまたは本文の編集状態。
   */
  pressEnter(interaction: ConnectionInteraction): ConnectionInteraction {
    if (interaction.session.status === "selected") {
      return ConnectionInteraction.edit(
        interaction,
        interaction.session.connectionId,
      );
    }
    if (interaction.session.status !== "idle") {
      return interaction;
    }
    return {
      ...interaction,
      board: StickyInteractionValue.pressEnter(interaction.board),
    };
  },

  /**
   * Esc をラベル確定、接続モード終了、または付箋操作として解釈する。
   *
   * @param interaction キー操作前の状態。
   * @returns 確定または選択解除後の状態。
   */
  pressEscape(interaction: ConnectionInteraction): ConnectionInteraction {
    if (interaction.session.status === "editing") {
      return ConnectionInteraction.commitEdit(interaction);
    }
    if (interaction.session.status !== "idle") {
      return {
        ...interaction,
        session: { status: "idle" },
        error: OptionValue.none(),
      };
    }
    return {
      ...interaction,
      board: StickyInteractionValue.pressEscape(interaction.board),
    };
  },

  /**
   * 選択中の接続を削除し、履歴へ1エントリ積む。
   *
   * @param interaction 削除前の状態。
   * @returns 接続削除後の状態。接続を選択していなければ入力を返す。
   */
  pressDelete(interaction: ConnectionInteraction): ConnectionInteraction {
    if (interaction.session.status !== "selected") {
      return interaction;
    }
    const connection = Document.connectionById(
      interaction.board.workingDocument,
      interaction.session.connectionId,
    );
    if (!connection.some) {
      return { ...interaction, session: { status: "idle" } };
    }
    const document = Document.removeConnection(
      interaction.board.workingDocument,
      connection.value.id,
    );
    return {
      board: executeDocumentChange(interaction.board, document),
      session: { status: "idle" },
      error: OptionValue.none(),
    };
  },

  /** 直前の文書操作を取り消す。 */
  undo(interaction: ConnectionInteraction): ConnectionInteraction {
    const committed = ConnectionInteraction.commitEdit(interaction);
    const board = StickyInteractionValue.undo(committed.board);
    return withExistingConnectionSession({ ...committed, board });
  },

  /** 取り消した文書操作をやり直す。 */
  redo(interaction: ConnectionInteraction): ConnectionInteraction {
    const committed = ConnectionInteraction.commitEdit(interaction);
    const board = StickyInteractionValue.redo(committed.board);
    return withExistingConnectionSession({ ...committed, board });
  },
} as const;

/** 文書変更を実行し、付箋操作と共有する履歴へ積む。 */
const executeDocumentChange = (
  board: StickyInteraction,
  document: Document,
): StickyInteraction => {
  if (document === board.workingDocument) {
    return board;
  }
  const history = History.execute(
    board.history,
    ReplaceDocumentCommand.create({
      previous: board.history.current,
      next: document,
    }),
  );
  return {
    ...board,
    history,
    workingDocument: history.current,
    session: { status: "idle" },
  };
};

/** 履歴操作後も対象の接続が残っている場合だけ選択を維持する。 */
const withExistingConnectionSession = (
  interaction: ConnectionInteraction,
): ConnectionInteraction => {
  if (interaction.session.status === "selectingTarget") {
    const source = Document.stickyById(
      interaction.board.workingDocument,
      interaction.session.sourceId,
    );
    return source.some
      ? interaction
      : {
          ...interaction,
          session: { status: "idle" },
          error: OptionValue.none(),
        };
  }
  if (
    interaction.session.status !== "selected" &&
    interaction.session.status !== "editing"
  ) {
    return interaction;
  }
  const connection = Document.connectionById(
    interaction.board.workingDocument,
    interaction.session.connectionId,
  );
  return connection.some
    ? interaction
    : { ...interaction, session: { status: "idle" } };
};
