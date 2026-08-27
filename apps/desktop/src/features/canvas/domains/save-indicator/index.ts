import type { ValueOf } from "@domain-modeler/canvas-core";

/** 自動保存インジケータの状態。 */
export const SAVE_INDICATOR_STATUSES = {
  saved: "saved",
  saving: "saving",
  failed: "failed",
} as const;

export type SaveIndicatorStatus = ValueOf<typeof SAVE_INDICATOR_STATUSES>;

/** ステータスバーに出す保存状態。 */
export type SaveIndicator = Readonly<{
  status: SaveIndicatorStatus;
  label: string;
}>;

const LABELS = {
  saved: "保存済み",
  saving: "保存中",
  failed: "保存に失敗",
} as const satisfies Record<SaveIndicatorStatus, string>;

/** 保存状態の表示を扱う関数群。 */
export const SaveIndicator = {
  /**
   * 保存状態からインジケータを生成する。
   *
   * @param status 保存済み / 保存中 / 失敗。
   * @returns 表示するラベルを含むインジケータ。
   */
  from(status: SaveIndicatorStatus): SaveIndicator {
    return { status, label: LABELS[status] };
  },
} as const;
