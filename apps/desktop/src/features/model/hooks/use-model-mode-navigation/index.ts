import { useEffectEvent, useLayoutEffect, useReducer, useRef, type RefObject } from "react";
import type { SourceRange } from "@domain-modeler/model-core";
import type { TextEditing } from "../use-text-editing";

type Mode = "model" | "state-machine";
type NavigationState = Readonly<{ mode: Mode; selectedMachineIndex: number }>;
type NavigationAction =
  | Readonly<{ type: "modelOpened" }>
  | Readonly<{ type: "stateMachineOpened"; index?: number }>
  | Readonly<{ type: "machineSelected"; index: number }>;

const reduceNavigation = (state: NavigationState, action: NavigationAction): NavigationState => {
  switch (action.type) {
    case "modelOpened":
      return { ...state, mode: "model" };
    case "stateMachineOpened":
      return { mode: "state-machine", selectedMachineIndex: action.index ?? state.selectedMachineIndex };
    case "machineSelected":
      return { ...state, selectedMachineIndex: action.index };
  }
};

type UseModelModeNavigationParams = Readonly<{ editing: TextEditing }>;
type UseModelModeNavigationResult = Readonly<{
  mode: Mode;
  selectedMachineIndex: number;
  previewRef: RefObject<HTMLElement | null>;
  openModel: (range?: SourceRange) => void;
  openStateMachine: (index?: number) => void;
  selectMachine: (index: number) => void;
}>;

/** モードとマシンの選択、モデル画面の caret・スクロール復元を管理する。 */
export function useModelModeNavigation({ editing }: UseModelModeNavigationParams): UseModelModeNavigationResult {
  const [navigation, dispatch] = useReducer(reduceNavigation, { mode: "model", selectedMachineIndex: 0 });
  const previewRef = useRef<HTMLElement>(null);
  const modelScroll = useRef({ editorTop: 0, editorLeft: 0, previewTop: 0 });
  const hasModelSnapshot = useRef(false);
  const pendingSourceRange = useRef<SourceRange | null>(null);

  const openStateMachine = (index?: number) => {
    if (navigation.mode === "model") {
      const input = editing.inputRef.current;
      editing.rememberCurrentSelection();
      modelScroll.current = {
        editorTop: input?.scrollTop ?? 0,
        editorLeft: input?.scrollLeft ?? 0,
        previewTop: previewRef.current?.scrollTop ?? 0,
      };
      hasModelSnapshot.current = true;
    }
    dispatch({ type: "stateMachineOpened", index });
  };

  const openModel = (range?: SourceRange) => {
    pendingSourceRange.current = range ?? null;
    dispatch({ type: "modelOpened" });
  };

  const restoreModelView = useEffectEvent(() => {
    if (!hasModelSnapshot.current) {
      return;
    }
    const input = editing.inputRef.current;
    if (input === null) {
      return;
    }
    if (previewRef.current !== null) {
      previewRef.current.scrollTop = modelScroll.current.previewTop;
    }
    const range = pendingSourceRange.current;
    pendingSourceRange.current = null;
    if (range !== null) {
      editing.selectRange(range);
      return;
    }
    editing.restoreSelection();
    input.scrollTop = modelScroll.current.editorTop;
    input.scrollLeft = modelScroll.current.editorLeft;
    input.dispatchEvent(new Event("scroll", { bubbles: true }));
  });

  useLayoutEffect(() => {
    if (navigation.mode === "model") {
      restoreModelView();
    }
  }, [navigation.mode]);

  return {
    mode: navigation.mode,
    selectedMachineIndex: navigation.selectedMachineIndex,
    previewRef,
    openModel,
    openStateMachine,
    selectMachine: (index) => dispatch({ type: "machineSelected", index }),
  };
}
