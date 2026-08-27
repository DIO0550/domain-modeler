import { useState, type ReactNode } from "react";
import { STICKY_TYPES, type StickyType } from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../../domains/sticky-appearance";
import {
  SaveIndicator,
  type SaveIndicatorStatus,
} from "../../domains/save-indicator";
import { ZoomLabel } from "../../domains/zoom-label";

/** ツールバーの undo / redo。有効なときだけハンドラを持つ。 */
export type HistoryButton =
  | Readonly<{ availability: "disabled" }>
  | Readonly<{ availability: "enabled"; onClick: () => void }>;

type CanvasViewProps = Readonly<{
  zoom: number;
  saveStatus: SaveIndicatorStatus;
  undo: HistoryButton;
  redo: HistoryButton;
}>;

/**
 * キャンバス画面。種別パレット、無限キャンバス、保存/ズーム表示を持つ。
 *
 * @param props ズーム、保存状態、履歴ボタン。
 * @returns キャンバス画面。
 */
export function CanvasView({ zoom, saveStatus, undo, redo }: CanvasViewProps) {
  const [selectedType, setSelectedType] = useState<StickyType>(
    STICKY_TYPES.event,
  );
  const appearances = StickyAppearance.all();
  const saveIndicator = SaveIndicator.from(saveStatus);
  const zoomLabel = ZoomLabel.fromZoom(zoom);

  return (
    <div className="canvas-view">
      <CanvasToolbar>
        <Palette
          appearances={appearances}
          selectedType={selectedType}
          onSelectType={setSelectedType}
        />
        <HistoryControls undo={undo} redo={redo} />
      </CanvasToolbar>
      <CanvasSurface />
      <CanvasStatusBar saveIndicator={saveIndicator} zoomLabel={zoomLabel} />
    </div>
  );
}

type CanvasToolbarProps = Readonly<{
  children: ReactNode;
}>;

/**
 * 種別パレットと undo / redo を並べる上部ツールバー。
 *
 * @param props パレットと履歴の子要素。
 * @returns ツールバー。
 */
function CanvasToolbar({ children }: CanvasToolbarProps) {
  return (
    <div
      className="canvas-toolbar"
      role="toolbar"
      aria-label="キャンバスツール"
    >
      {children}
    </div>
  );
}

type PaletteProps = Readonly<{
  appearances: readonly StickyAppearance[];
  selectedType: StickyType;
  onSelectType: (type: StickyType) => void;
}>;

/**
 * 付箋8種のパレット。
 *
 * @param props 種別表示、選択中の種別、選択ハンドラ。
 * @returns 種別ボタン群。
 */
function Palette({ appearances, selectedType, onSelectType }: PaletteProps) {
  return (
    <div className="canvas-palette" role="group" aria-label="付箋種別">
      {appearances.map((appearance) => (
        <PaletteButton
          key={appearance.type}
          appearance={appearance}
          selected={appearance.type === selectedType}
          onSelect={onSelectType}
        />
      ))}
    </div>
  );
}

type HistoryControlsProps = Readonly<{
  undo: HistoryButton;
  redo: HistoryButton;
}>;

/**
 * undo / redo ボタン群。
 *
 * @param props 履歴ボタン。
 * @returns 履歴グループ。
 */
function HistoryControls({ undo, redo }: HistoryControlsProps) {
  return (
    <div className="canvas-history" role="group" aria-label="履歴">
      <HistoryControlButton label="元に戻す" button={undo} />
      <HistoryControlButton label="やり直す" button={redo} />
    </div>
  );
}

type PaletteButtonProps = Readonly<{
  appearance: StickyAppearance;
  selected: boolean;
  onSelect: (type: StickyType) => void;
}>;

/**
 * 1つの付箋種別を選ぶパレットボタン。
 *
 * @param props 種別表示、選択中か、選択ハンドラ。
 * @returns 種別ボタン。
 */
function PaletteButton({ appearance, selected, onSelect }: PaletteButtonProps) {
  return (
    <button
      type="button"
      className={paletteButtonClassName(selected)}
      aria-pressed={selected}
      aria-label={appearance.caption}
      onClick={() => {
        onSelect(appearance.type);
      }}
    >
      <span
        className="canvas-palette__swatch"
        data-sticky-type={appearance.type}
        aria-hidden="true"
      />
      <span className="canvas-palette__caption">{appearance.caption}</span>
    </button>
  );
}

type HistoryControlButtonProps = Readonly<{
  label: string;
  button: HistoryButton;
}>;

/**
 * undo / redo ボタン。無効なときは実行しない。
 *
 * @param props 表示名と有効状態。
 * @returns 履歴ボタン。
 */
function HistoryControlButton({ label, button }: HistoryControlButtonProps) {
  const isDisabled = button.availability === "disabled";
  return (
    <button
      type="button"
      className={historyButtonClassName(button.availability)}
      aria-disabled={isDisabled}
      onClick={() => {
        if (button.availability === "disabled") {
          return;
        }
        button.onClick();
      }}
    >
      {label}
    </button>
  );
}

/**
 * パンとズームだけで移動する無限キャンバス領域。スクロールバーは持たない。
 *
 * @returns キャンバス面。
 */
function CanvasSurface() {
  return (
    <div
      className="canvas-surface"
      role="region"
      aria-label="キャンバス"
    />
  );
}

type CanvasStatusBarProps = Readonly<{
  saveIndicator: SaveIndicator;
  zoomLabel: ZoomLabel;
}>;

/**
 * 保存状態とズーム倍率を出すステータスバー。
 *
 * @param props 保存インジケータとズーム表示。
 * @returns ステータスバー。
 */
function CanvasStatusBar({ saveIndicator, zoomLabel }: CanvasStatusBarProps) {
  return (
    <div className="canvas-status">
      <span
        className="canvas-status__save"
        data-save-status={saveIndicator.status}
        role="status"
      >
        {saveIndicator.label}
      </span>
      <span className="canvas-status__zoom" aria-label={`ズーム ${zoomLabel}`}>
        {zoomLabel}
      </span>
    </div>
  );
}

/**
 * パレットボタンの class を組み立てる。
 *
 * @param selected この種別が選ばれているか。
 * @returns canvas-palette__button と選択修飾。
 */
const paletteButtonClassName = (selected: boolean): string => {
  const selectedClass = selected ? ["canvas-palette__button--selected"] : [];
  const classNames = ["canvas-palette__button", ...selectedClass];
  return classNames.join(" ");
};

/**
 * 履歴ボタンの class を組み立てる。
 *
 * @param availability 有効または無効。
 * @returns canvas-history__button と無効修飾。
 */
const historyButtonClassName = (
  availability: HistoryButton["availability"],
): string => {
  const disabledClass =
    availability === "disabled" ? ["canvas-history__button--disabled"] : [];
  const classNames = ["canvas-history__button", ...disabledClass];
  return classNames.join(" ");
};
