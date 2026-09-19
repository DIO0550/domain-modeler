import {
  useRef,
  useId,
  useState,
  type HTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  STICKY_TYPES,
  Option,
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
import { useCanvasSurface, type ViewportSurfaceInteraction } from "../../hooks";
import { EventTargetEx } from "@/utils/EventTargetEx";

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
  showToolbar?: boolean;
  placementTool?: Readonly<{ active: boolean; onSelect: () => void }>;
  inspector?: ReactNode;
  onPaletteDrop?: (
    placement: Readonly<{ type: StickyType; point: Point }>,
  ) => void;
  gestureEvents?: Pick<
    HTMLAttributes<HTMLDivElement>,
    "onPointerDownCapture" | "onClickCapture" | "onDoubleClickCapture"
  >;
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
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onSurfaceKeyDown?: (key: "Enter" | "Escape" | "Delete" | "Backspace") => void;
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
  showToolbar = true,
  placementTool,
  inspector,
  onPaletteDrop,
  gestureEvents,
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
  onKeyDown,
  connectionTool,
}: CanvasViewProps) {
  const paletteHelpId = useId();
  const [dragType, setDragType] = useState<Option<StickyType>>(Option.none());
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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const canvas = event.currentTarget;
    const ownerDocument = canvas.ownerDocument;
    const focused = ownerDocument.activeElement;
    onKeyDown?.(event);
    if (
      !event.defaultPrevented ||
      focused === null ||
      !canvas.contains(focused)
    ) {
      return;
    }
    // React のイベント更新で削除された要素だけを対象にする。
    // 別の操作が既にフォーカスを移していれば、その移動を優先する。
    queueMicrotask(() => {
      if (
        !canvas.isConnected ||
        focused.isConnected ||
        ownerDocument.activeElement !== ownerDocument.body
      ) {
        return;
      }
      canvas
        .querySelector<HTMLElement>(".canvas-surface")
        ?.focus({ preventScroll: true });
    });
  };

  return (
    <div className="canvas-view" onKeyDown={handleKeyDown} {...gestureEvents}>
      {showToolbar && (
        <CanvasToolbar>
          {placementTool !== undefined ? (
            <button
              type="button"
              className={paletteButtonClassName(!placementTool.active)}
              aria-pressed={!placementTool.active}
              onClick={placementTool.onSelect}
            >
              選択
            </button>
          ) : null}
          <HistoryControls undo={undo} redo={redo} />
          {connectionTool !== undefined && (
            <ConnectionControls tool={connectionTool} />
          )}
        </CanvasToolbar>
      )}
      <div className="canvas-workspace">
        <aside className="canvas-sidebar" aria-label="部品パレット">
          {placementTool !== undefined && !showToolbar && (
            <button
              type="button"
              className="canvas-sidebar__select"
              aria-pressed={!placementTool.active}
              onClick={placementTool.onSelect}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="m5 3 14 10-7 1-3 7Z" />
              </svg>
              選択
            </button>
          )}
          <h2>部品</h2>
          <p id={paletteHelpId}>選んで空白をクリック、またはドラッグして配置</p>
          <Palette
            helpId={paletteHelpId}
            appearances={appearances}
            selectedType={
              dragType.some
                ? dragType.value
                : placementTool !== undefined && !placementTool.active
                  ? undefined
                  : selectedType
            }
            onSelectType={selectType}
            dragEvents={{
              onStart: (type) => {
                placementTool?.onSelect();
                setDragType(Option.some(type));
              },
              onEnd: () => setDragType(Option.none()),
            }}
          />
        </aside>
        <CanvasSurface
          viewport={viewport}
          viewportInteraction={viewportInteraction}
          onClick={onSurfaceClick}
          onDoubleClick={onSurfaceDoubleClick}
          onKeyDown={onSurfaceKeyDown}
          placement={
            dragType.some
              ? {
                  status: "dragging",
                  type: dragType.value,
                  onDrop: (point) => {
                    onPaletteDrop?.({ type: dragType.value, point });
                    setDragType(Option.none());
                  },
                }
              : placementTool?.active
                ? { status: "placing", type: selectedType }
                : { status: "inactive" }
          }
        >
          {children}
        </CanvasSurface>
        {inspector}
      </div>
      {placementTool?.active ? (
        <div className="canvas-placement-status" role="status">
          空白をクリックして1個配置 · Escで取消
        </div>
      ) : null}
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
 * 選択・履歴・接続の共通操作を並べる上部ツールバー。
 *
 * @param props 共通操作の子要素。
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
  helpId: string;
  appearances: readonly StickyAppearance[];
  selectedType: StickyType | undefined;
  onSelectType: (type: StickyType) => void;
  dragEvents: Readonly<{
    onStart: (type: StickyType) => void;
    onEnd: () => void;
  }>;
}>;

/**
 * 付箋8種のパレット。
 *
 * @param props 種別表示、選択中の種別、選択ハンドラ。
 * @returns 種別ボタン群。
 */
function Palette({
  helpId,
  appearances,
  selectedType,
  onSelectType,
  dragEvents,
}: PaletteProps) {
  return (
    <div className="canvas-palette" role="group" aria-label="付箋種別">
      {appearances.map((appearance) => (
        <PaletteButton
          key={appearance.type}
          helpId={helpId}
          appearance={appearance}
          selected={appearance.type === selectedType}
          onSelect={onSelectType}
          dragEvents={dragEvents}
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
  helpId: string;
  appearance: StickyAppearance;
  selected: boolean;
  onSelect: (type: StickyType) => void;
  dragEvents: PaletteProps["dragEvents"];
}>;

/**
 * 1つの付箋種別を選ぶパレットボタン。
 *
 * @param props 種別表示、選択中か、選択ハンドラ。
 * @returns 種別ボタン。
 */
function PaletteButton({
  helpId,
  appearance,
  selected,
  onSelect,
  dragEvents,
}: PaletteButtonProps) {
  const suppressClick = useRef(false);
  return (
    <button
      type="button"
      className={paletteButtonClassName(selected)}
      aria-pressed={selected}
      aria-label={appearance.caption}
      aria-describedby={helpId}
      draggable
      onPointerDown={() => {
        suppressClick.current = false;
      }}
      onDragStart={(event) => {
        suppressClick.current = true;
        event.dataTransfer.setData(
          "application/x-domain-modeler-sticky",
          appearance.type,
        );
        event.dataTransfer.effectAllowed = "copy";
        dragEvents.onStart(appearance.type);
      }}
      onDragEnd={dragEvents.onEnd}
      onClick={(event) => {
        if (suppressClick.current && event.detail !== 0) {
          return;
        }
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
  placement:
    | Readonly<{ status: "inactive" }>
    | Readonly<{ status: "placing"; type: StickyType }>
    | Readonly<{
        status: "dragging";
        type: StickyType;
        onDrop: (point: Point) => void;
      }>;
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
  placement,
  viewport,
  viewportInteraction,
  children,
  onClick,
  onDoubleClick,
  onKeyDown,
}: CanvasSurfaceProps) {
  const [pointer, setPointer] = useState<Option<Point>>(Option.none());
  const surfaceRef = useCanvasSurface(viewportInteraction);
  const appearance =
    placement.status === "inactive"
      ? undefined
      : StickyAppearance.of(placement.type);
  const isBackground = (
    target: EventTarget | null,
    surface: HTMLDivElement,
  ): boolean => target === surface || target === surface.firstElementChild;
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
      data-placing={placement.status !== "inactive"}
      style={style}
      onPointerDownCapture={(event) => {
        viewportInteraction?.onPointerDown(
          event,
          event.target === event.currentTarget ||
            event.target === event.currentTarget.firstElementChild,
        );
      }}
      onPointerMove={(event) => {
        viewportInteraction?.onPointerMove(event);
        if (placement.status === "inactive") {
          return;
        }
        setPointer(
          isBackground(event.target, event.currentTarget) && event.buttons === 0
            ? Option.some(surfacePointFromMouse(event))
            : Option.none(),
        );
      }}
      onPointerLeave={() => setPointer(Option.none())}
      onDragOver={(event) => {
        if (placement.status !== "dragging") {
          return;
        }
        event.preventDefault();
        const background = isBackground(event.target, event.currentTarget);
        event.dataTransfer.dropEffect = background ? "copy" : "none";
        setPointer(
          background
            ? Option.some(surfacePointFromMouse(event))
            : Option.none(),
        );
      }}
      onDragLeave={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        ) {
          return;
        }
        setPointer(Option.none());
      }}
      onDrop={(event) => {
        if (placement.status !== "dragging") {
          return;
        }
        event.preventDefault();
        cancelPendingClick();
        setPointer(Option.none());
        if (!isBackground(event.target, event.currentTarget)) {
          return;
        }
        placement.onDrop(surfacePointFromMouse(event));
      }}
      onPointerUp={viewportInteraction?.onPointerUp}
      onPointerCancel={viewportInteraction?.onPointerCancel}
      onLostPointerCapture={viewportInteraction?.onLostPointerCapture}
      onClickCapture={viewportInteraction?.onClickCapture}
      onClick={(event) => {
        if (onClick === undefined) {
          return;
        }
        if (EventTargetEx.isTextEntry(event.target)) {
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
        if (EventTargetEx.isTextEntry(event.target)) {
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
      {appearance !== undefined &&
      pointer.some &&
      !viewportInteraction?.isPanning ? (
        <div
          className="canvas-placement-preview"
          data-sticky-type={appearance.type}
          aria-hidden="true"
          style={{
            left: pointer.value.x,
            top: pointer.value.y,
            width: appearance.defaultSize.width,
            height: appearance.defaultSize.height,
            transform: `scale(${viewport.zoom}) translate(-50%, -50%)`,
          }}
        >
          {appearance.caption}
        </div>
      ) : null}
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
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.shiftKey ||
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
    if (EventTargetEx.isTextEntry(event.target)) {
      return;
    }
    event.preventDefault();
    onKeyDown(event.key);
    return;
  }
  if (event.key !== "Enter") {
    return;
  }
  if (EventTargetEx.isTextEntry(event.target)) {
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
