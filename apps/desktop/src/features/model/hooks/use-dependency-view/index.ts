import { useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { ModelGraph } from "@domain-modeler/model-core";
import { ElementNavigation } from "@/libs/element-navigation";
import { DependencyInspection } from "../../domains/dependency-inspection";
import type { AnalyzedModel } from "../../domains/analyzed-model";
import { DependencyDiagram } from "../../domains/dependency-diagram";
import { DependencySelection } from "../../domains/dependency-selection";
import { ModelGraphLayout } from "../../domains/model-graph-layout";
import { ElementSize } from "@/libs/element-size";
import { Option } from "@/utils/Option";

type UseDependencyViewParams = Readonly<{
  analyzed: AnalyzedModel;
  observeSizes: typeof ElementSize.observe;
}>;

/**
 * 図の計測境界と選択・表示範囲・再試行操作を仲介する。
 * @param params 同一本文の解析結果と寸法計測の境界。
 * @returns 図、表示範囲、計測中または配置結果、選択・表示切替・再試行操作。
 */
export function useDependencyView({
  analyzed,
  observeSizes,
}: UseDependencyViewParams) {
  const diagram = useMemo(() => DependencyDiagram.create(analyzed), [analyzed]);
  const measureRef = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const nodeElements = useRef(new Map<string, HTMLDivElement>());
  const [selection, dispatch] = useReducer(
    DependencySelection.reduce,
    diagram,
    DependencySelection.create,
  );
  const current =
    selection.diagram === diagram
      ? selection
      : DependencySelection.synchronize(selection, diagram);
  const selectedNode = DependencySelection.selectedNode(current);

  // 別の本文へ移った時点で再特定する。削除後に同名が復活しても選択を復活させない。
  if (selection.diagram !== diagram) {
    dispatch({ type: "synchronize", diagram });
  }

  const selectedId = Option.isSome(selectedNode)
    ? Option.some(selectedNode.value.id)
    : Option.none();
  const select = (id: string) => dispatch({ type: "select", id });
  const visibleDiagram = useMemo(
    () => DependencySelection.visibleDiagram(current),
    [current],
  );
  const [measurement, setMeasurement] = useState<
    Option<
      Readonly<{
        diagram: DependencyDiagram;
        sizes: Parameters<typeof ModelGraphLayout.create>[1];
      }>
    >
  >(Option.none());

  useLayoutEffect(() => {
    const container = measureRef.current;

    if (container === null) {
      return;
    }

    let active = true;
    const stop = observeSizes(container, (sizes) => {
      if (!active) {
        return;
      }

      setMeasurement(Option.some({ diagram, sizes }));
    });

    return () => {
      active = false;
      stop();
    };
  }, [diagram, observeSizes, attempt]);

  const layout = useMemo(() => {
    if (Option.isNone(measurement)) {
      return Option.none();
    }

    if (measurement.value.diagram !== diagram) {
      return Option.none();
    }

    return Option.some(
      ModelGraphLayout.create(diagram.graph, measurement.value.sizes),
    );
  }, [diagram, measurement]);

  return {
    diagram,
    visibleDiagram,
    mode: current.target.mode,
    setMode: (mode: DependencySelection["target"]["mode"]) =>
      dispatch({ type: "set-mode", mode }),
    measureRef,
    layout,
    selected: DependencyDiagram.selectedCard(diagram, selectedId),
    inspection: Option.isSome(selectedId)
      ? DependencyInspection.create(diagram, selectedId.value)
      : Option.none(),
    neighborhood: Option.isSome(selectedId)
      ? Option.some(ModelGraph.neighborhood(diagram.graph, selectedId.value))
      : Option.none(),
    nodeElements,
    select,
    reveal: (id: string) => {
      const element = nodeElements.current.get(id);

      if (element === undefined) {
        return;
      }

      select(id);
      ElementNavigation.reveal(element);
    },
    clearSelection: () => dispatch({ type: "clear" }),
    retry: () => setAttempt((current) => current + 1),
  };
}
