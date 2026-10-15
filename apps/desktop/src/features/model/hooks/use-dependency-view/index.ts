import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ModelGraph } from "@domain-modeler/model-core";
import { ElementNavigation } from "@/libs/element-navigation";
import { DependencyInspection } from "../../domains/dependency-inspection";
import type { AnalyzedModel } from "../../domains/analyzed-model";
import { DependencyDiagram } from "../../domains/dependency-diagram";
import { ModelGraphLayout } from "../../domains/model-graph-layout";
import { ElementSize } from "@/libs/element-size";
import { Option } from "@/utils/Option";

type UseDependencyViewParams = Readonly<{
  analyzed: AnalyzedModel;
  observeSizes: typeof ElementSize.observe;
}>;

/**
 * 図の計測境界と選択・再試行操作を仲介する。
 * @param params 同一本文の解析結果と寸法計測の境界。
 * @returns 図、計測中または配置結果、選択と再試行操作。
 */
export function useDependencyView({
  analyzed,
  observeSizes,
}: UseDependencyViewParams) {
  const diagram = useMemo(() => DependencyDiagram.create(analyzed), [analyzed]);
  const measureRef = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const nodeElements = useRef(new Map<string, HTMLDivElement>());
  const [selection, setSelection] = useState<
    Readonly<{
      diagram: DependencyDiagram;
      node: Option<ModelGraph["nodes"][number]>;
    }>
  >({ diagram, node: Option.none() });
  const selectedNode = Option.isNone(selection.node)
    ? Option.none()
    : DependencyDiagram.currentNode(diagram, selection.node.value);

  // 別の本文へ移った時点で再特定する。削除後に同名が復活しても選択を復活させない。
  if (selection.diagram !== diagram) {
    setSelection({ diagram, node: selectedNode });
  }

  const selectedId = Option.isSome(selectedNode)
    ? Option.some(selectedNode.value.id)
    : Option.none();
  const select = (id: string) => {
    setSelection({
      diagram,
      node: DependencyDiagram.selectedNode(diagram, id),
    });
  };
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
    clearSelection: () => setSelection({ diagram, node: Option.none() }),
    retry: () => setAttempt((current) => current + 1),
  };
}
