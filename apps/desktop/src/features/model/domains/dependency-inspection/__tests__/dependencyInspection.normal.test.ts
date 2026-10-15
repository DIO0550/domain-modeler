import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../analyzed-model";
import { DependencyDiagram } from "../../dependency-diagram";
import { DependencyInspection } from "..";

test("選択モデルの定義と直接の依存先・参照元を返す", () => {
  const source =
    "data 商品 = string\ndata 注文 = 商品\ndata 結果 = 注文\ndata 孤立 = int\n";
  const diagram = DependencyDiagram.create(AnalyzedModel.create(source));
  const inspection = Option.unwrap(
    DependencyInspection.create(diagram, diagram.cards[1].id),
  );

  expect(Option.unwrap(inspection.definition).text).toBe("data 注文 = 商品");
  expect(inspection.dependencies.map((item) => item.node.name)).toEqual([
    "商品",
  ]);
  expect(inspection.referrers.map((item) => item.node.name)).toEqual(["結果"]);
});

test("同じ接続先の複数役割と同一役割の出現位置をすべて残す", () => {
  const source =
    "data 注文 = string\nworkflow 更新 =\n  input: 注文 AND 注文 list\n  output: 注文\n  error: 注文\n";
  const diagram = DependencyDiagram.create(AnalyzedModel.create(source));
  const inspection = Option.unwrap(
    DependencyInspection.create(diagram, diagram.cards[1].id),
  );
  const references = inspection.dependencies[0].references;

  expect(inspection.dependencies).toHaveLength(1);
  expect(references.map((item) => item.role)).toEqual([
    "input",
    "input",
    "output",
    "error",
  ]);
  expect(
    references.map((item) => [
      item.nameRange.startLine,
      item.nameRange.startColumn,
    ]),
  ).toEqual([
    [3, 10],
    [3, 17],
    [4, 11],
    [5, 10],
  ]);
});

test("同名宣言の2件目は2件目の本文と診断を返す", () => {
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create("data 注文 = string\ndata 注文 = int\n"),
  );
  const inspection = Option.unwrap(
    DependencyInspection.create(diagram, diagram.cards[1].id),
  );

  expect(Option.unwrap(inspection.definition).text).toBe("data 注文 = int");
  expect(inspection.card.name).toBe("注文 (行 2)");
  expect(
    inspection.node.diagnostics.some((item) => item.severity === "error"),
  ).toBe(true);
});

test("循環と自己参照は両方向の参照一覧として返す", () => {
  const diagram = DependencyDiagram.create(
    AnalyzedModel.create("data 木 = 木 list AND 枝\ndata 枝 = 木\n"),
  );
  const inspection = Option.unwrap(
    DependencyInspection.create(diagram, diagram.cards[0].id),
  );

  expect(inspection.dependencies.map((item) => item.node.name)).toEqual([
    "木",
    "枝",
  ]);
  expect(inspection.referrers.map((item) => item.node.name)).toEqual([
    "木",
    "枝",
  ]);
});
