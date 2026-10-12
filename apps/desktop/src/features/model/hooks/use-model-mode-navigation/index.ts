import {
  useEffectEvent,
  useLayoutEffect,
  useReducer,
  useRef,
  type RefObject,
} from "react";
import type { SourceRange } from "@domain-modeler/model-core";
import type { TextEditing } from "../use-text-editing";

type Mode = "model" | "state-machine";
type ModelView = "definition" | "dependency";

type NavigationState = Readonly<{
  mode: Mode;
  modelView: ModelView;
  selectedMachineIndex: number;
}>;

type NavigationAction =
  | Readonly<{ type: "modelOpened" }>
  | Readonly<{ type: "definitionOpened" }>
  | Readonly<{ type: "dependencyOpened" }>
  | Readonly<{ type: "stateMachineOpened"; index?: number }>
  | Readonly<{ type: "machineSelected"; index: number }>;

const reduceNavigation = (
  state: NavigationState,
  action: NavigationAction,
): NavigationState => {
  switch (action.type) {
    case "modelOpened":
      return { ...state, mode: "model" };

    case "definitionOpened":
      return { ...state, mode: "model", modelView: "definition" };

    case "dependencyOpened":
      return { ...state, mode: "model", modelView: "dependency" };

    case "stateMachineOpened":
      return {
        ...state,
        mode: "state-machine",
        selectedMachineIndex: action.index ?? state.selectedMachineIndex,
      };

    case "machineSelected":
      return { ...state, selectedMachineIndex: action.index };
  }
};

type UseModelModeNavigationParams = Readonly<{ editing: TextEditing }>;

type UseModelModeNavigationResult = Readonly<{
  mode: Mode;
  modelView: ModelView;
  selectedMachineIndex: number;
  previewRef: RefObject<HTMLElement | null>;
  openModel: (range?: SourceRange) => void;
  openModelMode: () => void;
  openDependency: () => void;
  openStateMachine: (index?: number) => void;
  selectMachine: (index: number) => void;
}>;

/** モードとマシンの選択、モデル画面の caret・スクロール復元を管理する。 */
export function useModelModeNavigation({
  editing,
}: UseModelModeNavigationParams): UseModelModeNavigationResult {
  const [navigation, dispatch] = useReducer(reduceNavigation, {
    mode: "model",
    modelView: "definition",
    selectedMachineIndex: 0,
  });
  const previewRef = useRef<HTMLElement>(null);
  const modelScroll = useRef({ editorTop: 0, editorLeft: 0, previewTop: 0 });
  const hasModelSnapshot = useRef(false);
  const pendingSourceRange = useRef<SourceRange | null>(null);

  const rememberModelView = () => {
    if (navigation.mode === "model" && navigation.modelView === "definition") {
      const input = editing.inputRef.current;

      editing.rememberCurrentSelection();
      modelScroll.current = {
        editorTop: input?.scrollTop ?? 0,
        editorLeft: input?.scrollLeft ?? 0,
        previewTop: previewRef.current?.scrollTop ?? 0,
      };
      hasModelSnapshot.current = true;
    }
  };

  const openStateMachine = (index?: number) => {
    rememberModelView();

    dispatch({ type: "stateMachineOpened", index });
  };

  const openModel = (range?: SourceRange) => {
    if (
      range !== undefined &&
      navigation.mode === "model" &&
      navigation.modelView === "definition"
    ) {
      editing.selectRange(range);

      return;
    }

    pendingSourceRange.current = range ?? null;
    dispatch({ type: "definitionOpened" });
  };

  const openDependency = () => {
    rememberModelView();
    dispatch({ type: "dependencyOpened" });
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
    if (navigation.mode === "model" && navigation.modelView === "definition") {
      restoreModelView();
    }
  }, [navigation.mode, navigation.modelView]);

  return {
    mode: navigation.mode,
    modelView: navigation.modelView,
    selectedMachineIndex: navigation.selectedMachineIndex,
    previewRef,
    openModel,
    openModelMode: () => dispatch({ type: "modelOpened" }),
    openDependency,
    openStateMachine,

    selectMachine: (index) => dispatch({ type: "machineSelected", index }),
  };
}
