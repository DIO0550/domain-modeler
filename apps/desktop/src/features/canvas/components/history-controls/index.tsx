import { useMemo } from "react";

/** 履歴操作の実行可否と実行関数。 */
export type HistoryButton =
  | Readonly<{ availability: "disabled" }>
  | Readonly<{ availability: "enabled"; onClick: () => void }>;

/** アクティブ文書へ表示する履歴操作。 */
export type HistoryControlsValue = Readonly<{
  undo: HistoryButton;
  redo: HistoryButton;
}>;

/** 履歴ボタンを生成する関数群。 */
export const HistoryButton = {
  /**
   * 押せない履歴ボタンを返す。
   *
   * @returns 無効な履歴ボタン。
   */
  disabled: (): HistoryButton => ({ availability: "disabled" }),
  /**
   * 押すと操作を実行する履歴ボタンを返す。
   *
   * @param onClick 実行する操作。
   * @returns 有効な履歴ボタン。
   */
  enabled: (onClick: () => void): HistoryButton => ({
    availability: "enabled",
    onClick,
  }),
} as const;

const DISABLED_HISTORY: HistoryControlsValue = {
  undo: HistoryButton.disabled(),
  redo: HistoryButton.disabled(),
};

type HistoryControlsProps = Readonly<{
  value?: HistoryControlsValue;
}>;

/**
 * 文書タイトル行へ表示するコンパクトな undo / redo 操作。
 *
 * @param props アクティブ文書の履歴操作。省略時は両方無効。
 * @returns アクセシブルな履歴操作群。
 */
export function HistoryControls({ value = DISABLED_HISTORY }: HistoryControlsProps) {
  const shortcutModifier = useMemo(() => historyShortcutModifier(), []);
  return (
    <div className="history-controls" role="group" aria-label="履歴操作">
      <HistoryControlButton
        label="元に戻す"
        shortcut={`${shortcutModifier}Z`}
        button={value.undo}
        icon="undo"
      />
      <HistoryControlButton
        label="やり直す"
        shortcut={`${shortcutModifier}Shift+Z`}
        button={value.redo}
        icon="redo"
      />
    </div>
  );
}

type HistoryControlButtonProps = Readonly<{
  label: string;
  shortcut: string;
  button: HistoryButton;
  icon: "undo" | "redo";
}>;

/** 履歴操作の1つをアイコンとツールチップで表示する。 */
function HistoryControlButton({
  label,
  shortcut,
  button,
  icon,
}: HistoryControlButtonProps) {
  const isDisabled = button.availability === "disabled";
  return (
    <button
      type="button"
      className={historyButtonClassName(button.availability)}
      aria-label={label}
      title={`${label} (${shortcut})`}
      disabled={isDisabled}
      onClick={button.availability === "enabled" ? button.onClick : undefined}
    >
      <HistoryIcon icon={icon} />
    </button>
  );
}

type HistoryIconProps = Readonly<{
  icon: "undo" | "redo";
}>;

/** undo / redo を表す線画アイコン。 */
function HistoryIcon({ icon }: HistoryIconProps) {
  const path = icon === "undo" ? "M9 6 4 11l5 5" : "m15 6 5 5-5 5";
  const curve =
    icon === "undo" ? "M5 11h8a5 5 0 0 1 5 5" : "M19 11h-8a5 5 0 0 0-5 5";
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
      <path d={curve} />
    </svg>
  );
}

/** 履歴ボタンの class を組み立てる。 */
const historyButtonClassName = (
  availability: HistoryButton["availability"],
): string => {
  const disabledClass =
    availability === "disabled" ? ["history-controls__button--disabled"] : [];
  return ["history-controls__button", ...disabledClass].join(" ");
};

/** 実行環境に合わせたキーボードショートカットの修飾キーを返す。 */
const historyShortcutModifier = (): "⌘" | "Ctrl+" => {
  if (typeof navigator === "undefined") {
    return "Ctrl+";
  }
  return /Mac|iPhone|iPad|iPod/.test(
    `${navigator.platform} ${navigator.userAgent}`,
  )
    ? "⌘"
    : "Ctrl+";
};
