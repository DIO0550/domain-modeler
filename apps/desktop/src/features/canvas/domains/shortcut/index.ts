import { Option, type ValueOf } from "@domain-modeler/canvas-core";

/** キャンバスが受け付けるキーボード操作の語彙。 */
export const CANVAS_SHORTCUTS = {
  undo: "undo",
  redo: "redo",
  delete: "delete",
  copy: "copy",
  paste: "paste",
  front: "front",
  fitAll: "fitAll",
  zoomIn: "zoomIn",
  zoomOut: "zoomOut",
} as const;

/** キャンバスが受け付けるキーボード操作。 */
export type CanvasShortcut = ValueOf<typeof CANVAS_SHORTCUTS>;

/** OS に依存しないキー割り当て。DOM と編集状態の判定は呼び出し側が行う。 */
export const CanvasShortcut = {
  /** 修飾キーを含めて一致する操作を返す。未割り当て・IME 入力は受け付けない。 */
  create(
    event: Readonly<{
      key: string;
      code?: string;
      ctrlKey: boolean;
      metaKey: boolean;
      shiftKey: boolean;
      altKey: boolean;
      isComposing: boolean;
      keyCode: number;
    }>,
  ): Option<CanvasShortcut> {
    if (event.isComposing || event.keyCode === 229 || event.altKey) {
      return Option.none();
    }
    if (!event.ctrlKey && !event.metaKey) {
      return !event.shiftKey &&
        (event.key === "Delete" || event.key === "Backspace")
        ? Option.some(CANVAS_SHORTCUTS.delete)
        : Option.none();
    }
    const key = event.key.toLowerCase();
    if (key === "z") {
      return Option.some(event.shiftKey ? CANVAS_SHORTCUTS.redo : CANVAS_SHORTCUTS.undo);
    }
    // 記号は入力文字に加え US 配列の物理位置でも受け付ける。
    // AltGraph を要する配列でも Alt を押さない代替操作を提供する。
    if (
      event.shiftKey &&
      (key === "]" || key === "}" || event.code === "BracketRight")
    ) {
      return Option.some(CANVAS_SHORTCUTS.front);
    }
    if (key === "+" || key === "=" || event.code === "Equal") {
      return Option.some(CANVAS_SHORTCUTS.zoomIn);
    }
    if (key === "0" || event.code === "Digit0") {
      return Option.some(CANVAS_SHORTCUTS.fitAll);
    }
    if (key === "-" || event.code === "Minus") {
      return Option.some(CANVAS_SHORTCUTS.zoomOut);
    }
    if (event.shiftKey) {
      return Option.none();
    }
    switch (key) {
      case "c":
        return Option.some(CANVAS_SHORTCUTS.copy);
      case "v":
        return Option.some(CANVAS_SHORTCUTS.paste);
      default:
        return Option.none();
    }
  },
} as const;
