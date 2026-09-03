import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  STICKY_TYPES,
  type Point,
  type StickyType,
  type Viewport as ViewportModel,
} from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../../domains/sticky-appearance";
import {
  SaveIndicator,
  type SaveIndicatorStatus,
} from "../../domains/save-indicator";
import { ZoomLabel } from "../../domains/zoom-label";
import type { ViewportSurfaceInteraction } from "../../hooks";

/** ツールバーの undo / redo。有効なときだけハンドラを持つ。 */
export type HistoryButton =
  | Readonly<{ availability: "disabled" }>
  | Readonly<{ availability: "enabled"; onClick: () => void }>;

/** `HistoryButton` を生成する関数群。 */
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

type CanvasViewProps = Readonly<{
  viewport: ViewportModel;
  viewportInteraction?: ViewportSurfaceInteraction;
  saveStatus: SaveIndicatorStatus;
  undo: HistoryButton;
  redo: HistoryButton;
  children?: ReactNode;
  selectedType?: StickyType;
  onSelectType?: (type: StickyType) => void;
  onSurfaceClick?: (point: Point) => void;
  onSurfaceDoubleClick?: (point: Point) => void;
  onSurfaceKeyDown?: (
    key: "Enter" | "Escape" | "Delete" | "Backspace",
  ) => void;
  connectionTool?: Readonly<{
    status: "inactive" | "selectingSource" | "selectingTarget";
    errorMessage?: string;
    onToggle: () => void;
  }>;
}>;

/**
 * キャンバス画面。種別パレット、無限キャンバス、保存/ズーム表示を持つ。
 *
 * @param props ズーム、保存状態、履歴ボタン、キャンバス面の子要素と操作。
 * @returns キャンバス画面。
 */
export function CanvasView({
  viewport,
  viewportInteraction,
  saveStatus,
  undo,
  redo,
  children,
  selectedType: selectedTypeProp,
  onSelectType,
  onSurfaceClick,
  onSurfaceDoubleClick,
  onSurfaceKeyDown,
  connectionTool,
}: CanvasViewProps) {
  const [uncontrolledType, setUncontrolledType] = useState<StickyType>(
    STICKY_TYPES.event,
  );
  const selectedType = selectedTypeProp ?? uncontrolledType;
  const appearances = StickyAppearance.all();
  const saveIndicator = SaveIndicator.create(saveStatus);
  const zoomLabel = ZoomLabel.toPercent(viewport.zoom);

  const selectType = (type: StickyType): void => {
    if (selectedTypeProp === undefined) {
      setUncontrolledType(type);
    }
    onSelectType?.(type);
  };

  return (
    <div className="canvas-view">
      <CanvasToolbar>
        <Palette
          appearances={appearances}
          selectedType={selectedType}
          onSelectType={selectType}
        />
        <HistoryControls undo={undo} redo={redo} />
        {connectionTool !== undefined && (
          <ConnectionControls tool={connectionTool} />
        )}
      </CanvasToolbar>
      <CanvasSurface
        viewport={viewport}
        viewportInteraction={viewportInteraction}
        onClick={onSurfaceClick}
        onDoubleClick={onSurfaceDoubleClick}
        onKeyDown={onSurfaceKeyDown}
      >
        {children}
      </CanvasSurface>
      <CanvasStatusBar saveIndicator={saveIndicator} zoomLabel={zoomLabel} />
    </div>
  );
}

type ConnectionControlsProps = Readonly<{
  tool: NonNullable<CanvasViewProps["connectionTool"]>;
}>;

/** 接続モードの切り替え、次の操作、core エラーを表示する。 */
function ConnectionControls({ tool }: ConnectionControlsProps) {
  const active = tool.status !== "inactive";
  const instruction = connectionInstruction(tool.status);
  return (
    <div className="canvas-connection" role="group" aria-label="接続操作">
      <button
        type="button"
        className={connectionButtonClassName(active)}
        aria-pressed={active}
        onClick={tool.onToggle}
      >
        接続
      </button>
      {instruction.length > 0 && (
        <span className="canvas-connection__instruction" role="status">
          {instruction}
        </span>
      )}
      {tool.errorMessage !== undefined && (
        <span className="canvas-connection__error" role="alert">
          {tool.errorMessage}
        </span>
      )}
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
    <div className="canvas-toolbar" role="group" aria-label="キャンバスツール">
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

type CanvasSurfaceProps = Readonly<{
  viewport: ViewportModel;
  viewportInteraction?: ViewportSurfaceInteraction;
  children?: ReactNode;
  onClick?: (point: Point) => void;
  onDoubleClick?: (point: Point) => void;
  onKeyDown?: (key: "Enter" | "Escape" | "Delete" | "Backspace") => void;
}>;

type CanvasSurfaceStyle = CSSProperties &
  Readonly<{
    "--canvas-grid-position-x": string;
    "--canvas-grid-position-y": string;
    "--canvas-grid-size": string;
  }>;

/**
 * パンとズームだけで移動する無限キャンバス領域。スクロールバーは持たない。
 *
 * @param props キャンバス上に置く付箋などの子要素、viewport、ポインタ操作。
 * @returns キャンバス面。
 */
function CanvasSurface({
  viewport,
  viewportInteraction,
  children,
  onClick,
  onDoubleClick,
  onKeyDown,
}: CanvasSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const pendingClick = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const cancelPendingClick = (): void => {
    if (pendingClick.current === undefined) {
      return;
    }
    clearTimeout(pendingClick.current);
    pendingClick.current = undefined;
  };
  const style: CanvasSurfaceStyle = {
    "--canvas-grid-position-x": `${viewport.x}px`,
    "--canvas-grid-position-y": `${viewport.y}px`,
    "--canvas-grid-size": `${24 * viewport.zoom}px`,
  };

  useEffect(() => {
    const surface = surfaceRef.current;
    const onWheel = viewportInteraction?.onWheel;
    if (surface === null || onWheel === undefined) {
      return;
    }
    const handleWheel = (event: globalThis.WheelEvent): void => {
      onWheel(event, surface);
    };
    surface.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      surface.removeEventListener("wheel", handleWheel);
    };
  }, [viewportInteraction?.onWheel]);

  return (
    <div
      ref={surfaceRef}
      className="canvas-surface"
      role="region"
      aria-label="キャンバス"
      tabIndex={
        onKeyDown === undefined && viewportInteraction === undefined
          ? undefined
          : 0
      }
      data-panning={viewportInteraction?.isPanning}
      style={style}
      onPointerDownCapture={viewportInteraction?.onPointerDown}
      onPointerMove={viewportInteraction?.onPointerMove}
      onPointerUp={viewportInteraction?.onPointerUp}
      onPointerCancel={viewportInteraction?.onPointerCancel}
      onClickCapture={viewportInteraction?.onClickCapture}
      onClick={(event) => {
        if (onClick === undefined) {
          return;
        }
        if (isTextEntryEventTarget(event.target)) {
          return;
        }
        const point = surfacePointFromMouse(event);
        if (event.detail === 0) {
          onClick(point);
          return;
        }
        cancelPendingClick();
        pendingClick.current = setTimeout(() => {
          pendingClick.current = undefined;
          onClick(point);
        }, 0);
      }}
      onDoubleClick={(event) => {
        if (onDoubleClick === undefined) {
          return;
        }
        if (isTextEntryEventTarget(event.target)) {
          return;
        }
        cancelPendingClick();
        onDoubleClick(surfacePointFromMouse(event));
      }}
      onKeyDown={(event) => {
        handleSurfaceKeyDown(event, onKeyDown);
      }}
    >
      <CanvasWorld viewport={viewport}>{children}</CanvasWorld>
    </div>
  );
}

type CanvasWorldProps = Readonly<{
  viewport: ViewportModel;
  children?: ReactNode;
}>;

/** viewport の移動と拡大率をキャンバス上の全要素へ適用する。 */
function CanvasWorld({ viewport, children }: CanvasWorldProps) {
  const style: CSSProperties = {
    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
  };
  return (
    <div className="canvas-world" style={style}>
      {children}
    </div>
  );
}

/**
 * キャンバス面を基準にしたクリック位置を返す。
 *
 * @param event 面に対するポインタイベント。
 * @returns 面の左上を原点とする座標。
 */
const surfacePointFromMouse = (event: MouseEvent<HTMLDivElement>): Point => {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

/**
 * イベントの発生元がテキスト入力か判定する。
 *
 * @param target イベントの発生元。
 * @returns textarea または input なら true。
 */
const isTextEntryEventTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement;

/**
 * Enter / Esc / Delete / Backspace をキャンバス操作へ渡す。
 * テキスト編集中の Enter と削除キーは入力へ譲る。
 * IME 変換中のキーは確定や選択解除に使わない。
 *
 * @param event 面または子要素からのキーイベント。
 * @param onKeyDown 解釈したキーを受け取るハンドラ。
 */
const handleSurfaceKeyDown = (
  event: KeyboardEvent<HTMLDivElement>,
  onKeyDown:
    | ((key: "Enter" | "Escape" | "Delete" | "Backspace") => void)
    | undefined,
): void => {
  if (onKeyDown === undefined) {
    return;
  }
  if (
    event.nativeEvent.isComposing ||
    event.nativeEvent.keyCode === 229
  ) {
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    onKeyDown("Escape");
    return;
  }
  if (event.key === "Delete" || event.key === "Backspace") {
    if (isTextEntryEventTarget(event.target)) {
      return;
    }
    event.preventDefault();
    onKeyDown(event.key);
    return;
  }
  if (event.key !== "Enter") {
    return;
  }
  if (isTextEntryEventTarget(event.target)) {
    return;
  }
  event.preventDefault();
  onKeyDown("Enter");
};

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

/** 接続モードで次に選ぶ端点を案内する。 */
const connectionInstruction = (
  status: NonNullable<CanvasViewProps["connectionTool"]>["status"],
): string => {
  if (status === "selectingSource") {
    return "始点の付箋を選択";
  }
  if (status === "selectingTarget") {
    return "終点の付箋を選択";
  }
  return "";
};

/** 接続ボタンの class を組み立てる。 */
const connectionButtonClassName = (active: boolean): string => {
  const activeClass = active ? ["canvas-connection__button--active"] : [];
  return ["canvas-connection__button", ...activeClass].join(" ");
};
