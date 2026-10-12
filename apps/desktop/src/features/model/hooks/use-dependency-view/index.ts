import { useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const [selected, setSelected] = useState<Option<string>>(Option.none());
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

    return observeSizes(container, (sizes) =>
      setMeasurement(Option.some({ diagram, sizes })),
    );
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
    selected: DependencyDiagram.selectedCard(diagram, selected),
    select: (id: string) => setSelected(Option.some(id)),
    clearSelection: () => setSelected(Option.none()),
    retry: () => setAttempt((current) => current + 1),
  };
}
