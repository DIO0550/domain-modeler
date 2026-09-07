import { Option } from "@domain-modeler/canvas-core";

/** キャンバスが受け付けるキーボード操作。 */
export type CanvasShortcut =
  | "undo"
  | "redo"
  | "delete"
  | "copy"
  | "paste"
  | "front"
  | "fitAll"
  | "zoomIn"
  | "zoomOut";

/** OS に依存しないキー割り当て。DOM と編集状態の判定は呼び出し側が行う。 */
export const CanvasShortcut = {
  /** 修飾キーを含めて一致する操作を返す。未割り当て・IME 入力は受け付けない。 */
  fromKey(
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
        ? Option.some("delete")
        : Option.none();
    }
    const key = event.key.toLowerCase();
    if (key === "z") {
      return Option.some(event.shiftKey ? "redo" : "undo");
    }
    if (event.shiftKey && (key === "]" || key === "}")) {
      return Option.some("front");
    }
    if (key === "+" || key === "=") {
      return Option.some("zoomIn");
    }
    if (event.shiftKey) {
      return Option.none();
    }
    switch (key) {
      case "c":
        return Option.some("copy");
      case "v":
        return Option.some("paste");
      case "0":
        return Option.some("fitAll");
      case "-":
        return Option.some("zoomOut");
      default:
        return Option.none();
    }
  },
} as const;
