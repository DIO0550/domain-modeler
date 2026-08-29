import {
  Document,
  History,
  type Point,
  ReplaceDocumentCommand,
  STICKY_TYPES,
  type Sticky,
  type StickyId,
  type StickyType,
} from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../sticky-appearance";

/** 付箋の選択と本文編集の状態。編集中は下書き本文を持つ。 */
export type StickySession =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "selected"; stickyId: StickyId }>
  | Readonly<{
      status: "editing";
      stickyId: StickyId;
      draftText: string;
      originalText: string;
    }>;

/** キャンバス上の付箋作成・選択・編集と、その履歴。 */
export type StickyInteraction = Readonly<{
  history: History;
  workingDocument: Document;
  selectedType: StickyType;
  session: StickySession;
}>;

/** 付箋の作成・選択・編集セッションを進める関数群。 */
export const StickyInteraction = {
  /**
   * 文書から、選択も編集もない操作状態を生成する。
   *
   * @param document 初期文書。省略時は空の文書。
   * @returns 履歴が空の操作状態。
   */
  create(document: Document = Document.empty()): StickyInteraction {
    return {
      history: History.create(document),
      workingDocument: document,
      selectedType: STICKY_TYPES.event,
      session: { status: "idle" },
    };
  },

  /**
   * パレットで選ぶ付箋種別を変える。
   *
   * @param interaction 変更前の操作状態。
   * @param selectedType 次に作成する種別。
   * @returns 種別だけを更新した操作状態。
   */
  selectType(
    interaction: StickyInteraction,
    selectedType: StickyType,
  ): StickyInteraction {
    return { ...interaction, selectedType };
  },

  /**
   * キャンバス上の点をクリックした操作を進める。
   * 付箋があれば選択し、空白なら選んでいる種別で作成して本文編集を始める。
   *
   * @param interaction クリック前の操作状態。
   * @param point ワールド座標のクリック位置。
   * @returns 選択または作成後の操作状態。
   */
  clickAt(interaction: StickyInteraction, point: Point): StickyInteraction {
    const committed = StickyInteraction.commitEdit(interaction);
    const hit = Document.stickyAt(committed.workingDocument, point);
    if (hit.some) {
      return {
        ...committed,
        session: { status: "selected", stickyId: hit.value.id },
      };
    }
    return addStickyAndEdit(committed, point);
  },

  /**
   * 指定した付箋を選択する。編集中なら先に確定する。
   *
   * @param interaction 選択前の操作状態。
   * @param stickyId 選択する付箋 ID。
   * @returns 選択後の操作状態。付箋が無ければ確定後の状態。
   */
  select(
    interaction: StickyInteraction,
    stickyId: StickyId,
  ): StickyInteraction {
    const committed = StickyInteraction.commitEdit(interaction);
    const sticky = Document.stickyById(committed.workingDocument, stickyId);
    if (!sticky.some) {
      return committed;
    }
    return {
      ...committed,
      session: { status: "selected", stickyId },
    };
  },

  /**
   * キャンバス上の点をダブルクリックした操作を進める。
   * 付箋があれば本文編集を始め、空白なら何もしない。
   *
   * @param interaction ダブルクリック前の操作状態。
   * @param point ワールド座標のダブルクリック位置。
   * @returns 編集開始後、または空白のままの操作状態。
   */
  doubleClickAt(
    interaction: StickyInteraction,
    point: Point,
  ): StickyInteraction {
    const committed = StickyInteraction.commitEdit(interaction);
    const hit = Document.stickyAt(committed.workingDocument, point);
    if (!hit.some) {
      return committed;
    }
    return startEditing(committed, hit.value);
  },

  /**
   * 編集中の下書き本文を更新する。履歴には積まない。
   *
   * @param interaction 編集中の操作状態。
   * @param draftText 次の下書き。
   * @returns 下書きを反映した操作状態。編集中でなければ入力を返す。
   */
  changeDraft(
    interaction: StickyInteraction,
    draftText: string,
  ): StickyInteraction {
    if (interaction.session.status !== "editing") {
      return interaction;
    }
    return {
      ...interaction,
      workingDocument: Document.updateStickyText(
        interaction.workingDocument,
        interaction.session.stickyId,
        draftText,
      ),
      session: { ...interaction.session, draftText },
    };
  },

  /**
   * 本文編集を確定する。本文が変わっていれば履歴へ 1 エントリ積む。
   *
   * @param interaction 確定前の操作状態。
   * @returns 選択中へ戻した操作状態。編集中でなければ入力を返す。
   */
  commitEdit(interaction: StickyInteraction): StickyInteraction {
    if (interaction.session.status !== "editing") {
      return interaction;
    }
    const selected: StickyInteraction = {
      ...interaction,
      session: {
        status: "selected",
        stickyId: interaction.session.stickyId,
      },
    };
    if (interaction.session.draftText === interaction.session.originalText) {
      return {
        ...selected,
        workingDocument: interaction.history.current,
      };
    }
    const history = History.execute(
      interaction.history,
      ReplaceDocumentCommand.create({
        previous: interaction.history.current,
        next: interaction.workingDocument,
      }),
    );
    return {
      ...selected,
      history,
      workingDocument: history.current,
    };
  },

  /**
   * Enter を解釈する。選択中なら本文編集を始める。
   *
   * @param interaction キー操作前の操作状態。
   * @returns 編集開始後の操作状態。選択中でなければ入力を返す。
   */
  pressEnter(interaction: StickyInteraction): StickyInteraction {
    if (interaction.session.status !== "selected") {
      return interaction;
    }
    const sticky = Document.stickyById(
      interaction.workingDocument,
      interaction.session.stickyId,
    );
    if (!sticky.some) {
      return { ...interaction, session: { status: "idle" } };
    }
    return startEditing(interaction, sticky.value);
  },

  /**
   * Esc を解釈する。編集中なら確定し、選択中なら選択を解除する。
   *
   * @param interaction キー操作前の操作状態。
   * @returns 確定または選択解除後の操作状態。
   */
  pressEscape(interaction: StickyInteraction): StickyInteraction {
    if (interaction.session.status === "editing") {
      return StickyInteraction.commitEdit(interaction);
    }
    if (interaction.session.status === "selected") {
      return { ...interaction, session: { status: "idle" } };
    }
    return interaction;
  },

  /**
   * 直前の文書操作を取り消す。編集中なら先に確定する。
   *
   * @param interaction undo 前の操作状態。
   * @returns 取り消し後の操作状態。取り消す操作が無ければ確定後の状態。
   */
  undo(interaction: StickyInteraction): StickyInteraction {
    const committed = StickyInteraction.commitEdit(interaction);
    const undone = History.undo(committed.history);
    if (!undone.some) {
      return committed;
    }
    return withHistory(committed, undone.value);
  },

  /**
   * 取り消した文書操作をやり直す。編集中なら先に確定する。
   *
   * @param interaction redo 前の操作状態。
   * @returns やり直し後の操作状態。やり直す操作が無ければ確定後の状態。
   */
  redo(interaction: StickyInteraction): StickyInteraction {
    const committed = StickyInteraction.commitEdit(interaction);
    const redone = History.redo(committed.history);
    if (!redone.some) {
      return committed;
    }
    return withHistory(committed, redone.value);
  },

  /**
   * 取り消せる文書操作があるか判定する。
   *
   * @param interaction 判定する操作状態。
   * @returns 取り消せる場合は true。
   */
  hasUndo(interaction: StickyInteraction): boolean {
    return History.undo(interaction.history).some;
  },

  /**
   * やり直せる文書操作があるか判定する。
   *
   * @param interaction 判定する操作状態。
   * @returns やり直せる場合は true。
   */
  hasRedo(interaction: StickyInteraction): boolean {
    return History.redo(interaction.history).some;
  },
} as const;

/**
 * 空白クリックで付箋を追加し、本文編集を始める。
 *
 * @param interaction 追加前の操作状態。
 * @param point 新しい付箋の左上位置。
 * @returns 追加と編集開始後の操作状態。サイズが不正なら入力を返す。
 */
const addStickyAndEdit = (
  interaction: StickyInteraction,
  point: Point,
): StickyInteraction => {
  const appearance = StickyAppearance.of(interaction.selectedType);
  const added = Document.addSticky(
    interaction.workingDocument,
    interaction.selectedType,
    "",
    point,
    appearance.defaultSize,
  );
  if (!added.ok) {
    return interaction;
  }
  const sticky = added.value.stickies[added.value.stickies.length - 1];
  if (sticky === undefined) {
    return interaction;
  }
  const history = History.execute(
    interaction.history,
    ReplaceDocumentCommand.create({
      previous: interaction.history.current,
      next: added.value,
    }),
  );
  return {
    history,
    workingDocument: history.current,
    selectedType: interaction.selectedType,
    session: {
      status: "editing",
      stickyId: sticky.id,
      draftText: "",
      originalText: "",
    },
  };
};

/**
 * 指定した付箋の本文編集を始める。
 *
 * @param interaction 編集開始前の操作状態。
 * @param sticky 編集する付箋。
 * @returns 下書きをその付箋の本文で始めた操作状態。
 */
const startEditing = (
  interaction: StickyInteraction,
  sticky: Sticky,
): StickyInteraction => ({
  ...interaction,
  session: {
    status: "editing",
    stickyId: sticky.id,
    draftText: sticky.text,
    originalText: sticky.text,
  },
});

/**
 * 履歴の現在文書へ合わせ、消えた付箋の選択を解除する。
 *
 * @param interaction 履歴を差し替える前の操作状態。
 * @param history 差し替える履歴。
 * @returns 文書と選択を揃えた操作状態。
 */
const withHistory = (
  interaction: StickyInteraction,
  history: History,
): StickyInteraction => ({
  ...interaction,
  history,
  workingDocument: history.current,
  session: sessionIfStickyExists(interaction.session, history.current),
});

/**
 * 対象の付箋が残っていれば選択を維持し、消えていれば解除する。
 *
 * @param session 維持する選択または編集。
 * @param document 判定する文書。
 * @returns 残っている選択、または idle。
 */
const sessionIfStickyExists = (
  session: StickySession,
  document: Document,
): StickySession => {
  if (session.status === "idle") {
    return session;
  }
  const sticky = Document.stickyById(document, session.stickyId);
  if (!sticky.some) {
    return { status: "idle" };
  }
  if (session.status === "editing") {
    return { status: "selected", stickyId: session.stickyId };
  }
  return session;
};