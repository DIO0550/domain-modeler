import { Option } from "@domain-modeler/canvas-core";

import type { ValueOf } from "@/types/value-of";

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
    if (event.shiftKey && (key === "]" || key === "}")) {
      return Option.some(CANVAS_SHORTCUTS.front);
    }
    if (key === "+" || key === "=") {
      return Option.some(CANVAS_SHORTCUTS.zoomIn);
    }
    if (event.shiftKey) {
      return Option.none();
    }
    switch (key) {
      case "c":
        return Option.some(CANVAS_SHORTCUTS.copy);
      case "v":
        return Option.some(CANVAS_SHORTCUTS.paste);
      case "0":
        return Option.some(CANVAS_SHORTCUTS.fitAll);
      case "-":
        return Option.some(CANVAS_SHORTCUTS.zoomOut);
      default:
        return Option.none();
    }
  },
} as const;
