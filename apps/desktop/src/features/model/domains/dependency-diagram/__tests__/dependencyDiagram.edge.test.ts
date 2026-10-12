import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../analyzed-model";
import { DependencyDiagram } from "..";

test.each([
  "",
  "state-machine 状態 =\n  initial: 待機\n  state: 待機\n",
])("dataとworkflowがない本文から空の図を返す: %s", (source) => {
  const diagram = DependencyDiagram.create(AnalyzedModel.create(source));

  expect(diagram.cards).toEqual([]);
  expect(diagram.graph.edges).toEqual([]);
});

test("構文エラーと未定義警告を最新本文の正常宣言と一緒に返す", () => {
  const analyzed = AnalyzedModel.create("data =\ndata 注文 = 不明な注文\n");

  const diagram = DependencyDiagram.create(analyzed);

  expect(diagram.cards.map((card) => [card.name, card.kind])).toEqual([
    ["注文", "ALIAS"],
    ["不明な注文", "未定義"],
  ]);
  expect(diagram.diagnostics).toEqual(analyzed.diagnostics);
  expect(diagram.diagnostics.map((diagnostic) => diagnostic.severity)).toEqual([
    "error",
    "warning",
  ]);
});

test("未選択と存在しないIDからはカードを返さない", () => {
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create("data 注文 = string"),
  );

  expect(DependencyDiagram.selectedCard(diagram, Option.none())).toEqual(
    Option.none(),
  );
  expect(
    DependencyDiagram.selectedCard(diagram, Option.some("存在しないID")),
  ).toEqual(Option.none());
});

test("同名宣言でも別のIDで選択できる", () => {
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create("data 注文 = string\ndata 注文 = int\n"),
  );

  const selected = Option.unwrap(
    DependencyDiagram.selectedCard(diagram, Option.some(diagram.cards[1].id)),
  );

  expect(selected.name).toBe("注文 (行 2)");
  expect(selected.rows).toEqual([{ label: "別名", text: "int" }]);
});
