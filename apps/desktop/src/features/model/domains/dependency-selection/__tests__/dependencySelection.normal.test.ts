import { expect, test } from "vitest";
import { DependencySelection } from "..";
import { orderSource, selectModel } from "./dependencySelection.test-support";

test("注文の関連のみ表示は仕様サンプルの5ノード4辺で、2段先を含まない", () => {
  const { selection, diagram } = selectModel(orderSource, "注文");
  const before = JSON.stringify(diagram);

  const related = DependencySelection.reduce(selection, {
    type: "set-mode",
    mode: "related",
  });
  const visible = DependencySelection.visibleDiagram(related);

  expect(visible.cards.map((card) => card.name)).toEqual([
    "注文ID",
    "顧客情報",
    "注文明細",
    "注文",
    "注文を確定する",
  ]);
  expect(visible.graph.nodes).toHaveLength(5);
  expect(visible.graph.edges).toHaveLength(4);
  expect(JSON.stringify(diagram)).toBe(before);
});

test("全体に戻すと選択を維持し、全文書のカードと辺が復帰する", () => {
  const { selection, diagram, node } = selectModel(orderSource, "注文");
  const related = DependencySelection.reduce(selection, {
    type: "set-mode",
    mode: "related",
  });

  const all = DependencySelection.reduce(related, {
    type: "set-mode",
    mode: "all",
  });
  const visible = DependencySelection.visibleDiagram(all);

  expect(DependencySelection.selectedNode(all)).toEqual({
    some: true,
    value: node,
  });
  expect(visible.cards).toBe(diagram.cards);
  expect(visible.graph).toBe(diagram.graph);
});

test("関連のみ表示中に別モデルを選ぶと、その直接近傍へ追従する", () => {
  const { selection, diagram } = selectModel(orderSource, "注文");
  const related = DependencySelection.reduce(selection, {
    type: "set-mode",
    mode: "related",
  });
  const next = diagram.graph.nodes.find((node) => node.name === "注文明細")!;

  const moved = DependencySelection.reduce(related, {
    type: "select",
    id: next.id,
  });
  const visible = DependencySelection.visibleDiagram(moved);

  expect(moved.target.mode).toBe("related");
  expect(visible.cards.map((card) => card.name)).toEqual([
    "商品ID",
    "数量",
    "注文明細",
    "注文",
  ]);
  expect(visible.graph.edges).toHaveLength(3);
});

test("選択解除で全体表示へ戻る", () => {
  const { selection, diagram } = selectModel(orderSource, "注文");
  const related = DependencySelection.reduce(selection, {
    type: "set-mode",
    mode: "related",
  });

  const cleared = DependencySelection.reduce(related, { type: "clear" });

  expect(cleared).toEqual(DependencySelection.create(diagram));
});
