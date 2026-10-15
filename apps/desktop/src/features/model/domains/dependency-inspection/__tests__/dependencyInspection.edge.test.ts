import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../analyzed-model";
import { DependencyDiagram } from "../../dependency-diagram";
import { DependencyInspection } from "..";

test("未定義モデルには定義を捏造せず全参照元と警告を残す", () => {
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create("data 注文 = 未定義\ndata 結果 = 未定義 option\n"),
  );
  const node = diagram.graph.nodes.find((item) => item.kind === "unresolved")!;
  const inspection = Option.unwrap(
    DependencyInspection.create(diagram, node.id),
  );

  expect(inspection.definition).toEqual(Option.none());
  expect(inspection.dependencies).toEqual([]);
  expect(inspection.referrers.map((item) => item.node.name)).toEqual([
    "注文",
    "結果",
  ]);
  expect(inspection.node.diagnostics).toHaveLength(2);
});

test("孤立した宣言とプリミティブ型は接続一覧を増やさない", () => {
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create("data 注文 = string\n"),
  );
  const inspection = Option.unwrap(
    DependencyInspection.create(diagram, diagram.cards[0].id),
  );

  expect(inspection.dependencies).toEqual([]);
  expect(inspection.referrers).toEqual([]);
  expect(inspection.node.diagnostics).toEqual([]);
});

test("存在しない選択IDからは内容を返さない", () => {
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create("data 注文 = string\n"),
  );

  expect(DependencyInspection.create(diagram, "不存在")).toEqual(Option.none());
});

test("存在しないソース行の範囲から本文を切り出さない", () => {
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create("\n\ndata 注文 = string\n"),
  );

  expect(DependencyInspection.definition("", diagram.graph.nodes[0])).toEqual(
    Option.none(),
  );
});
