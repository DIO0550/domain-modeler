import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../analyzed-model";
import { DependencyDiagram } from "..";

test("dataとworkflowを宣言順に表示し、state-machineを図へ混ぜない", () => {
  const analyzed = AnalyzedModel.create(
    "data 注文 = string\nstate-machine 状態 =\n  initial: 待機\n  state: 待機\nworkflow 処理 =\n  input: 注文\n  output: string\n",
  );

  const diagram = DependencyDiagram.create(analyzed);

  expect(diagram.cards.map((card) => [card.name, card.kind])).toEqual([
    ["注文", "ALIAS"],
    ["処理", "WORKFLOW"],
  ]);
  expect(diagram.graph.nodes.map((node) => node.id)).toEqual(
    diagram.cards.map((card) => card.id),
  );
  expect(diagram.graph.edges).toHaveLength(1);
});

test("選択IDから対応する宣言だけを返す", () => {
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create("data A = string\ndata B = int\n"),
  );
  const selected = diagram.cards[1];

  expect(
    DependencyDiagram.selectedCard(diagram, Option.some(selected.id)),
  ).toEqual(Option.some(selected));
});

test("循環・自己参照でも同じ本文の全宣言と参照を保持する", () => {
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create("data A = B\ndata B = A\ndata 木 = 木 list\n"),
  );

  expect(diagram.cards.map((card) => card.name)).toEqual(["A", "B", "木"]);
  expect(diagram.graph.edges).toHaveLength(3);
  expect(diagram.diagnostics).toEqual([]);
});
