import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../analyzed-model";
import { DependencyDiagram } from "../../dependency-diagram";
import { DependencySelection } from "..";
import { orderSource, selectModel } from "./dependencySelection.test-support";

test("未選択で関連のみを要求しても全体表示を維持する", () => {
  const diagram = DependencyDiagram.create(AnalyzedModel.create(orderSource));
  const initial = DependencySelection.create(diagram);

  const selection = DependencySelection.reduce(initial, {
    type: "set-mode",
    mode: "related",
  });

  expect(selection).toEqual(initial);
});

test("存在しないノードを選ぶと選択を解除して全体表示へ戻る", () => {
  const { selection, diagram } = selectModel(orderSource, "注文");
  const related = DependencySelection.reduce(selection, {
    type: "set-mode",
    mode: "related",
  });

  const missing = DependencySelection.reduce(related, {
    type: "select",
    id: "missing",
  });

  expect(missing).toEqual(DependencySelection.create(diagram));
});

test("未定義ノードも重複せず直接の参照元だけを表示する", () => {
  const { selection } = selectModel(
    "data A = 不明 AND 不明\ndata B = 不明\ndata C = A\n",
    "不明",
  );

  const related = DependencySelection.reduce(selection, {
    type: "set-mode",
    mode: "related",
  });
  const visible = DependencySelection.visibleDiagram(related);

  expect(visible.cards.map((card) => card.name)).toEqual(["A", "不明", "B"]);
  expect(visible.graph.edges).toHaveLength(2);
});

test("自己ループはノードも辺も1件で、無限展開しない", () => {
  const { selection } = selectModel(
    "data 木 = 木 list\ndata 孤立 = string\n",
    "木",
  );

  const related = DependencySelection.reduce(selection, {
    type: "set-mode",
    mode: "related",
  });
  const visible = DependencySelection.visibleDiagram(related);

  expect(visible.cards.map((card) => card.name)).toEqual(["木"]);
  expect(visible.graph.edges).toHaveLength(1);
});

test("循環していても近傍同士の辺を表示しない", () => {
  const { selection, node } = selectModel(
    "data A = B AND C\ndata B = C\ndata C = A\n",
    "A",
  );

  const related = DependencySelection.reduce(selection, {
    type: "set-mode",
    mode: "related",
  });
  const visible = DependencySelection.visibleDiagram(related);

  expect(visible.cards).toHaveLength(3);
  expect(visible.graph.edges).toHaveLength(3);
  expect(
    visible.graph.edges.every(
      (edge) => edge.from === node.id || edge.to === node.id,
    ),
  ).toBe(true);
});

test("孤立モデルの関連のみ表示は選択ノード1件だけになる", () => {
  const { selection } = selectModel(
    "data 孤立 = string\ndata 他 = int\n",
    "孤立",
  );

  const related = DependencySelection.reduce(selection, {
    type: "set-mode",
    mode: "related",
  });
  const visible = DependencySelection.visibleDiagram(related);

  expect(visible.cards.map((card) => card.name)).toEqual(["孤立"]);
  expect(visible.graph.edges).toEqual([]);
});

test("本文更新で対象が削除されると全体へ戻り、同名が再追加されても選択を復活させない", () => {
  const { selection } = selectModel(orderSource, "注文");
  const related = DependencySelection.reduce(selection, {
    type: "set-mode",
    mode: "related",
  });
  const deleted = DependencyDiagram.create(
    AnalyzedModel.create("data 別 = string\n"),
  );

  const cleared = DependencySelection.reduce(related, {
    type: "synchronize",
    diagram: deleted,
  });
  const restored = DependencySelection.reduce(cleared, {
    type: "synchronize",
    diagram: selection.diagram,
  });

  expect(cleared).toEqual(DependencySelection.create(deleted));
  expect(restored.target.mode).toBe("all");
  expect(DependencySelection.selectedNode(restored)).toEqual(Option.none());
});

test("対象が一意に残る本文更新では関連のみ表示と選択を維持する", () => {
  const { selection } = selectModel(orderSource, "注文");
  const related = DependencySelection.reduce(selection, {
    type: "set-mode",
    mode: "related",
  });
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create(`data 先頭 = int\n${orderSource}`),
  );

  const current = DependencySelection.reduce(related, {
    type: "synchronize",
    diagram,
  });

  expect(current.target.mode).toBe("related");
  expect(Option.unwrap(DependencySelection.selectedNode(current)).name).toBe(
    "注文",
  );
  expect(DependencySelection.visibleDiagram(current).cards).toHaveLength(5);
});

test("別の図にしか存在しない選択ノードでは関連のみ表示を作らない", () => {
  const { selection } = selectModel(orderSource, "注文");
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create("data 別 = string\n"),
  );

  const current = DependencySelection.create(diagram, {
    mode: "related",
    node: DependencySelection.selectedNode(selection),
  });

  expect(current).toEqual(DependencySelection.create(diagram));
});
