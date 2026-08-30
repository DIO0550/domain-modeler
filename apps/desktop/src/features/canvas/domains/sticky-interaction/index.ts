import {
  Document,
  History,
  type Point,
  ReplaceDocumentCommand,
  type Size,
  STICKY_TYPES,
  type Sticky,
  type StickyId,
  type StickyType,
} from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../sticky-appearance";

/** 四隅にあるリサイズハンドル。 */
export const STICKY_RESIZE_CORNERS = {
  northWest: "northWest",
  northEast: "northEast",
  southEast: "southEast",
  southWest: "southWest",
} as const;

/** 四隅にあるリサイズハンドルの位置。 */
export type StickyResizeCorner =
  (typeof STICKY_RESIZE_CORNERS)[keyof typeof STICKY_RESIZE_CORNERS];

/** 四隅のリサイズハンドルを列挙する関数群。 */
export const StickyResizeCorner = {
  /**
   * 描画順に四隅を返す。
   *
   * @returns 北西、北東、南東、南西のリサイズハンドル。
   */
  all: (): readonly StickyResizeCorner[] => [
    STICKY_RESIZE_CORNERS.northWest,
    STICKY_RESIZE_CORNERS.northEast,
    STICKY_RESIZE_CORNERS.southEast,
    STICKY_RESIZE_CORNERS.southWest,
  ],
} as const;

/** 付箋の選択、本文編集、ドラッグ、リサイズの状態。 */
export type StickySession =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "selected"; stickyId: StickyId }>
  | Readonly<{
      status: "editing";
      stickyId: StickyId;
      draftText: string;
      originalText: string;
    }>
  | Readonly<{
      status: "dragging";
      originalSticky: Sticky;
      pointerOrigin: Point;
    }>
  | Readonly<{
      status: "resizing";
      originalSticky: Sticky;
      pointerOrigin: Point;
      corner: StickyResizeCorner;
    }>;

/** 1枚の付箋に出す選択枠、本文編集、ポインタ操作。操作ハンドラは持たない。 */
export type StickyChromeView =
  | Readonly<{ status: "plain" }>
  | Readonly<{ status: "selected" }>
  | Readonly<{ status: "editing"; draftText: string }>
  | Readonly<{ status: "dragging" }>
  | Readonly<{ status: "resizing" }>;

/** `StickySession` から1枚の付箋の表示を導く関数群。 */
export const StickySession = {
  /**
   * 対象の付箋に出す選択枠または本文編集を返す。
   *
   * @param session キャンバス全体の選択と編集。
   * @param stickyId この付箋の ID。
   * @returns その付箋の表示。対象でなければ通常表示。
   */
  chromeOf(session: StickySession, stickyId: StickyId): StickyChromeView {
    if (session.status === "idle") {
      return { status: "plain" };
    }
    if (
      (session.status === "dragging" || session.status === "resizing") &&
      session.originalSticky.id !== stickyId
    ) {
      return { status: "plain" };
    }
    if (
      session.status !== "dragging" &&
      session.status !== "resizing" &&
      session.stickyId !== stickyId
    ) {
      return { status: "plain" };
    }
    if (session.status === "selected") {
      return { status: "selected" };
    }
    if (session.status === "editing") {
      return { status: "editing", draftText: session.draftText };
    }
    return { status: session.status };
  },
} as const;

/** 付箋を縮められる最小サイズ。 */
const MINIMUM_STICKY_SIZE = { width: 60, height: 40 } as const;

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
    const committed = commitSession(interaction);
    const hit = Document.stickyAt(committed.workingDocument, point);
    if (hit.some) {
      return {
        ...committed,
        session: { status: "selected", stickyId: hit.value.id },
      };
    }
    return createEditingSticky(committed, point);
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
    const committed = commitSession(interaction);
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
    const committed = commitSession(interaction);
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
   * 付箋のドラッグを始める。開始時に対象を最前面へ移す。
   *
   * @param interaction 開始前の操作状態。
   * @param stickyId ドラッグする付箋 ID。
   * @param pointerOrigin ドラッグ開始時のポインタ座標。
   * @returns ドラッグ中の操作状態。付箋が無ければ入力を返す。
   */
  beginDrag(
    interaction: StickyInteraction,
    stickyId: StickyId,
    pointerOrigin: Point,
  ): StickyInteraction {
    const committed = commitSession(interaction);
    const sticky = Document.stickyById(committed.workingDocument, stickyId);
    if (!sticky.some) {
      return committed;
    }
    return {
      ...committed,
      workingDocument: Document.bringStickyToFront(
        committed.workingDocument,
        stickyId,
      ),
      session: {
        status: "dragging",
        originalSticky: sticky.value,
        pointerOrigin,
      },
    };
  },

  /**
   * 選択中の付箋のリサイズを始める。
   *
   * @param interaction 開始前の操作状態。
   * @param corner 操作する四隅のハンドル。
   * @param pointerOrigin リサイズ開始時のポインタ座標。
   * @returns リサイズ中の操作状態。選択中でなければ入力を返す。
   */
  beginResize(
    interaction: StickyInteraction,
    corner: StickyResizeCorner,
    pointerOrigin: Point,
  ): StickyInteraction {
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
    return {
      ...interaction,
      session: {
        status: "resizing",
        originalSticky: sticky.value,
        pointerOrigin,
        corner,
      },
    };
  },

  /**
   * ドラッグまたはリサイズ中の付箋を、現在のポインタ座標へ追従させる。
   * 中間状態は履歴へ積まない。
   *
   * @param interaction ポインタ移動前の操作状態。
   * @param point 現在のポインタ座標。
   * @returns 中間文書を更新した操作状態。連続操作中でなければ入力を返す。
   */
  movePointer(
    interaction: StickyInteraction,
    point: Point,
  ): StickyInteraction {
    if (interaction.session.status === "dragging") {
      const position = draggedPosition(interaction.session, point);
      return {
        ...interaction,
        workingDocument: Document.moveSticky(
          interaction.workingDocument,
          interaction.session.originalSticky.id,
          position,
        ),
      };
    }
    if (interaction.session.status !== "resizing") {
      return interaction;
    }
    const rectangle = resizedRectangle(interaction.session, point);
    const moved = Document.moveSticky(
      interaction.workingDocument,
      interaction.session.originalSticky.id,
      rectangle.position,
    );
    const resized = Document.resizeSticky(
      moved,
      interaction.session.originalSticky.id,
      rectangle.size,
    );
    return resized.ok
      ? { ...interaction, workingDocument: resized.value }
      : interaction;
  },

  /**
   * ドラッグまたはリサイズを確定する。中間状態が変化していれば履歴へ1エントリ積む。
   *
   * @param interaction 確定前の操作状態。
   * @returns 選択中へ戻した操作状態。連続操作中でなければ入力を返す。
   */
  commitManipulation(interaction: StickyInteraction): StickyInteraction {
    if (
      interaction.session.status !== "dragging" &&
      interaction.session.status !== "resizing"
    ) {
      return interaction;
    }
    const selected: StickyInteraction = {
      ...interaction,
      session: {
        status: "selected",
        stickyId: interaction.session.originalSticky.id,
      },
    };
    if (!hasManipulationChange(interaction)) {
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
    return { ...selected, history, workingDocument: history.current };
  },

  /**
   * ドラッグまたはリサイズを取り消し、操作開始前の文書へ戻す。
   *
   * @param interaction 取り消し前の操作状態。
   * @returns 選択中へ戻した操作状態。連続操作中でなければ入力を返す。
   */
  cancelManipulation(interaction: StickyInteraction): StickyInteraction {
    if (
      interaction.session.status !== "dragging" &&
      interaction.session.status !== "resizing"
    ) {
      return interaction;
    }
    return {
      ...interaction,
      workingDocument: interaction.history.current,
      session: {
        status: "selected",
        stickyId: interaction.session.originalSticky.id,
      },
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
    if (
      interaction.session.status === "dragging" ||
      interaction.session.status === "resizing"
    ) {
      return StickyInteraction.commitManipulation(interaction);
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
    const committed = commitSession(interaction);
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
    const committed = commitSession(interaction);
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
 * 空白に、本文編集中の新しい付箋を置く。
 *
 * @param interaction 追加前の操作状態。
 * @param point 新しい付箋の左上位置。
 * @returns 編集中の付箋を置いた操作状態。サイズが不正なら入力を返す。
 */
const createEditingSticky = (
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
 * ドラッグ開始位置から現在位置までの差分を、開始時の付箋位置へ加える。
 *
 * @param session ドラッグ開始時の付箋とポインタ。
 * @param point 現在のポインタ座標。
 * @returns 現在の付箋位置。
 */
const draggedPosition = (
  session: Extract<StickySession, { status: "dragging" }>,
  point: Point,
): Point => ({
  x:
    session.originalSticky.position.x +
    point.x -
    session.pointerOrigin.x,
  y:
    session.originalSticky.position.y +
    point.y -
    session.pointerOrigin.y,
});

/**
 * 操作した四隅をポインタへ追従させ、反対側の二辺を固定した矩形を返す。
 *
 * @param session リサイズ開始時の付箋、ポインタ、四隅。
 * @param point 現在のポインタ座標。
 * @returns 最小サイズを満たす付箋矩形。
 */
const resizedRectangle = (
  session: Extract<StickySession, { status: "resizing" }>,
  point: Point,
): Readonly<{ position: Point; size: Size }> => {
  const horizontalDelta = point.x - session.pointerOrigin.x;
  const verticalDelta = point.y - session.pointerOrigin.y;
  const movesWest =
    session.corner === STICKY_RESIZE_CORNERS.northWest ||
    session.corner === STICKY_RESIZE_CORNERS.southWest;
  const movesNorth =
    session.corner === STICKY_RESIZE_CORNERS.northWest ||
    session.corner === STICKY_RESIZE_CORNERS.northEast;
  const width = Math.max(
    MINIMUM_STICKY_SIZE.width,
    session.originalSticky.size.width +
      (movesWest ? -horizontalDelta : horizontalDelta),
  );
  const height = Math.max(
    MINIMUM_STICKY_SIZE.height,
    session.originalSticky.size.height +
      (movesNorth ? -verticalDelta : verticalDelta),
  );
  return {
    position: {
      x: movesWest
        ? session.originalSticky.position.x +
          session.originalSticky.size.width -
          width
        : session.originalSticky.position.x,
      y: movesNorth
        ? session.originalSticky.position.y +
          session.originalSticky.size.height -
          height
        : session.originalSticky.position.y,
    },
    size: { width, height },
  };
};

/**
 * ドラッグまたはリサイズの確定対象に、開始時からの変更があるか判定する。
 *
 * @param interaction 確定前の操作状態。
 * @returns 位置、サイズ、前面順のいずれかが変わっていれば true。
 */
const hasManipulationChange = (interaction: StickyInteraction): boolean => {
  if (
    interaction.session.status !== "dragging" &&
    interaction.session.status !== "resizing"
  ) {
    return false;
  }
  const original = interaction.session.originalSticky;
  const current = Document.stickyById(interaction.workingDocument, original.id);
  if (!current.some) {
    return false;
  }
  const positionChanged =
    current.value.position.x !== original.position.x ||
    current.value.position.y !== original.position.y;
  const sizeChanged =
    current.value.size.width !== original.size.width ||
    current.value.size.height !== original.size.height;
  if (interaction.session.status === "resizing") {
    return positionChanged || sizeChanged;
  }
  const originalFront =
    interaction.history.current.stickies[
      interaction.history.current.stickies.length - 1
    ];
  const movedToFront = originalFront?.id !== original.id;
  return positionChanged || movedToFront;
};

/**
 * 編集、ドラッグ、リサイズの中間文書を履歴へ確定する。
 *
 * @param interaction 確定前の操作状態。
 * @returns 確定後の操作状態。中間操作がなければ入力を返す。
 */
const commitSession = (interaction: StickyInteraction): StickyInteraction => {
  if (interaction.session.status === "editing") {
    return StickyInteraction.commitEdit(interaction);
  }
  return StickyInteraction.commitManipulation(interaction);
};

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
  const stickyId =
    session.status === "dragging" || session.status === "resizing"
      ? session.originalSticky.id
      : session.stickyId;
  const sticky = Document.stickyById(document, stickyId);
  if (!sticky.some) {
    return { status: "idle" };
  }
  if (session.status !== "selected") {
    return { status: "selected", stickyId };
  }
  return session;
};
