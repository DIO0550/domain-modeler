import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../analyzed-model";
import { DependencyDiagram } from "../../dependency-diagram";
import { expectLayout } from "../../model-graph-layout/__tests__/modelGraphLayout.test-support";
import { DependencyNavigation } from "..";

/** DSL全体を実物で解析・配置し、画面寸法だけを指定する。 */
export function navigationFixture(
  source = "data A = B\ndata B = string\ndata C = int\n",
) {
  const diagram = DependencyDiagram.create(AnalyzedModel.create(source));
  const sizes = new Map(
    diagram.cards.map((card) => [card.id, { width: 280, height: 180 }]),
  );
  const layout = expectLayout({ graph: diagram.graph, sizes });
  const frame = Option.some({
    layout,
    size: { width: 800, height: 500 },
    attempt: 0,
  });
  const navigation = DependencyNavigation.synchronize(
    DependencyNavigation.create(diagram),
    { diagram, frame },
  );

  return { diagram, frame, navigation, layout };
}

/** 選択と表示範囲のUI操作を実物のドメインへ渡す。 */
export function relatedNavigation(
  navigation: DependencyNavigation,
  id: string,
) {
  const selected = DependencyNavigation.reduce(navigation, {
    type: "selection",
    action: { type: "select", id },
  });

  return DependencyNavigation.reduce(selected, {
    type: "selection",
    action: { type: "set-mode", mode: "related" },
  });
}
