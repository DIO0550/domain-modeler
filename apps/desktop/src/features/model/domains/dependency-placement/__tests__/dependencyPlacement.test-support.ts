import { expect } from "vitest";
import type { ModelGraphLayout } from "../../model-graph-layout";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../analyzed-model";
import { DependencyDiagram } from "../../dependency-diagram";
import { DependencyPlacement } from "..";

/** 実際の解析から配置を生成し、DOM計測値だけを与える。 */
export function placeDiagram(
  source: string,
  previous: Option<DependencyPlacement> = Option.none(),
  attempt = 0,
) {
  const analyzed = AnalyzedModel.create(source);
  const diagram = Option.isSome(previous)
    ? DependencyDiagram.synchronize(previous.value.diagram, analyzed)
    : DependencyDiagram.create(analyzed);
  const sizes = new Map(
    diagram.cards.map((card) => [card.id, { width: 280, height: 180 }]),
  );
  const placement = DependencyPlacement.create(
    { diagram, sizes, attempt },
    previous,
  );

  return {
    diagram,
    sizes,
    placement,
    layout: expectPlacementLayout(placement),
  };
}

/** ソース位置に依存するIDを除き、表示されるモデルごとの配置を比較する。 */
export function modelPositions(placement: DependencyPlacement) {
  const layout = expectPlacementLayout(placement);

  return placement.diagram.graph.nodes
    .map((node) => {
      const position = layout.nodes.find((item) => item.id === node.id)!;

      return {
        name: node.name,
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

/** 配置失敗をテストの失敗として報告する。 */
export function expectPlacementLayout(
  placement: DependencyPlacement,
): ModelGraphLayout {
  expect(placement.result.ok).toBe(true);

  if (!placement.result.ok) {
    throw new Error(placement.result.error);
  }

  return placement.result.value;
}
