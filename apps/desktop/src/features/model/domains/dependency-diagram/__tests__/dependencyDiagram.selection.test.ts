import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../analyzed-model";
import { DependencyDiagram } from "..";

test("先頭へ行を追加しても一意のモデルは最新の宣言範囲で再特定する", () => {
  const original = DependencyDiagram.create(
    AnalyzedModel.create("data 商品 = string\ndata 注文 = 商品\n"),
  );
  const latest = DependencyDiagram.create(
    AnalyzedModel.create("\ndata 商品 = string\ndata 注文 = 商品\n"),
  );

  expect(
    Option.unwrap(
      DependencyDiagram.currentNode(latest, original.graph.nodes[1]),
    ).range.startLine,
  ).toBe(3);
});

test("同じ位置へ別のモデルが現れても選択を移さない", () => {
  const original = DependencyDiagram.create(
    AnalyzedModel.create("data 注文 = string\n"),
  );
  const latest = DependencyDiagram.create(
    AnalyzedModel.create("data 商品 = string\n"),
  );

  expect(
    DependencyDiagram.currentNode(latest, original.graph.nodes[0]),
  ).toEqual(Option.none());
});

test("同名宣言は同じ本文でのみ位置を使い、本文更新後には推測しない", () => {
  const original = DependencyDiagram.create(
    AnalyzedModel.create("data 注文 = string\ndata 注文 = int\n"),
  );
  const latest = DependencyDiagram.create(
    AnalyzedModel.create("\ndata 注文 = string\ndata 注文 = int\n"),
  );

  expect(
    DependencyDiagram.currentNode(original, original.graph.nodes[1]),
  ).toEqual(Option.some(original.graph.nodes[1]));
  expect(
    DependencyDiagram.currentNode(latest, original.graph.nodes[1]),
  ).toEqual(Option.none());
});

test("選択名が複数候補へ変わった場合には選択を解除する", () => {
  const original = DependencyDiagram.create(
    AnalyzedModel.create("data 注文 = string\n"),
  );
  const latest = DependencyDiagram.create(
    AnalyzedModel.create("data 注文 = string\ndata 注文 = int\n"),
  );

  expect(
    DependencyDiagram.currentNode(latest, original.graph.nodes[0]),
  ).toEqual(Option.none());
});
