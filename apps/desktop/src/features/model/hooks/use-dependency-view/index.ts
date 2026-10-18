import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { ModelGraph } from "@domain-modeler/model-core";
import { DiagramSurface } from "@/libs/diagram-surface";
import type { Point } from "@domain-modeler/canvas-core";
import { Result } from "@domain-modeler/model-core";
import { DependencyNavigation } from "../../domains/dependency-navigation";
import { useDependencySurface } from "../use-dependency-surface";
import { DependencyInspection } from "../../domains/dependency-inspection";
import type { AnalyzedModel } from "../../domains/analyzed-model";
import { DependencyDiagram } from "../../domains/dependency-diagram";
import { DependencySelection } from "../../domains/dependency-selection";
import { DependencyPlacement } from "../../domains/dependency-placement";
import { ElementSize } from "@/libs/element-size";
import { Option } from "@/utils/Option";

type UseDependencyViewParams = Readonly<{
  analyzed: AnalyzedModel;
  observeSizes: typeof ElementSize.observe;
  observeSurface?: typeof DiagramSurface.observe;
  isVisible?: boolean;
}>;

/**
 * 図の計測境界と選択・表示範囲・パン・ズーム・再配置を仲介する。
 * @param params 同一本文の解析結果と寸法計測の境界。
 * @returns 図と配置結果、一時的な表示位置、選択・閲覧・再配置操作。
 */
export function useDependencyView({
  analyzed,
  observeSizes,
  observeSurface = DiagramSurface.observe,
  isVisible = true,
}: UseDependencyViewParams) {
  const [navigation, dispatch] = useReducer(
    DependencyNavigation.reduce,
    analyzed,
    (model) => DependencyNavigation.create(DependencyDiagram.create(model)),
  );
  const diagram = useMemo(
    () => DependencyDiagram.synchronize(navigation.selection.diagram, analyzed),
    [navigation.selection.diagram, analyzed],
  );
  const measureRef = useRef<HTMLDivElement>(null);
  const nodeElements = useRef(new Map<string, HTMLDivElement>());
  const panBy = useCallback(
    (delta: Point) => dispatch({ type: "pan", delta }),
    [],
  );
  const zoomAt = useCallback(
    (factor: number, anchor: Point) =>
      dispatch({ type: "zoom", factor, anchor: Option.some(anchor) }),
    [],
  );
  const surface = useDependencySurface({
    panBy,
    zoomBy: zoomAt,
    observeSurface,
    isVisible,
  });
  const [placement, setPlacement] = useState<Option<DependencyPlacement>>(
    Option.none(),
  );

  useLayoutEffect(() => {
    const container = measureRef.current;

    if (!isVisible || container === null) {
      return;
    }

    let active = true;
    const stop = observeSizes(container, (sizes) => {
      if (!active) {
        return;
      }

      setPlacement((previous) =>
        Option.some(
          DependencyPlacement.create(
            { diagram, sizes, attempt: navigation.attempt },
            previous,
          ),
        ),
      );
    });

    return () => {
      active = false;
      stop();
    };
  }, [diagram, observeSizes, navigation.attempt, isVisible]);

  const layout = useMemo(() => {
    if (Option.isNone(placement)) {
      return Option.none();
    }

    if (
      placement.value.diagram !== diagram ||
      placement.value.attempt !== navigation.attempt
    ) {
      return Option.none();
    }

    return Option.some(placement.value.result);
  }, [diagram, placement, navigation.attempt]);

  const frame = useMemo(() => {
    if (Option.isNone(layout) || Option.isNone(surface.size)) {
      return Option.none();
    }

    if (Result.isErr(layout.value)) {
      return Option.none();
    }

    return Option.some({
      layout: layout.value.value,
      size: surface.size.value,
      attempt: Option.unwrap(placement).attempt,
    });
  }, [layout, surface.size, placement]);
  const current = DependencyNavigation.synchronize(navigation, {
    diagram,
    frame,
  });

  if (current !== navigation) {
    dispatch({ type: "synchronize", diagram, frame });
  }

  const selection = current.selection;
  const selectedNode = DependencySelection.selectedNode(selection);
  const selectedId = Option.isSome(selectedNode)
    ? Option.some(selectedNode.value.id)
    : Option.none();
  const visibleDiagram = DependencySelection.visibleDiagram(selection);
  const select = (id: string) =>
    dispatch({ type: "selection", action: { type: "select", id } });

  return {
    diagram,
    visibleDiagram,
    mode: selection.target.mode,
    setMode: (mode: DependencySelection["target"]["mode"]) =>
      dispatch({ type: "selection", action: { type: "set-mode", mode } }),
    measureRef,
    layout,
    viewport: DependencyNavigation.viewport(current),
    canNavigate: Option.isSome(frame) && diagram.cards.length > 0,
    surface,
    zoomBy: (factor: number) =>
      dispatch({ type: "zoom", factor, anchor: Option.none() }),
    fit: () => dispatch({ type: "fit" }),
    // 再計測・再配置後に、現在の表示対象へフィットする。
    rearrange: () => dispatch({ type: "rearrange" }),
    selected: DependencyDiagram.selectedCard(diagram, selectedId),
    inspection: Option.isSome(selectedId)
      ? DependencyInspection.create(diagram, selectedId.value)
      : Option.none(),
    neighborhood: Option.isSome(selectedId)
      ? Option.some(ModelGraph.neighborhood(diagram.graph, selectedId.value))
      : Option.none(),
    nodeElements,
    select,
    ensureVisible: (id: string) => dispatch({ type: "ensure-visible", id }),
    reveal: (id: string) => {
      dispatch({ type: "reveal", id });
      const element = nodeElements.current.get(id);

      if (element !== undefined) {
        DiagramSurface.focus(element);
      }
    },
    clearSelection: () =>
      dispatch({ type: "selection", action: { type: "clear" } }),
    retry: () => dispatch({ type: "rearrange" }),
  };
}
