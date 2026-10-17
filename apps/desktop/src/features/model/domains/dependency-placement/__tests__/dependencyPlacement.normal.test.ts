import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Result } from "@domain-modeler/model-core";
import { DependencyPlacement } from "..";
import {
  expectPlacementLayout,
  modelPositions,
  placeDiagram,
} from "./dependencyPlacement.test-support";

test("宣言の行位置と並び順が変わっても同じモデルの配置と線の経路を維持する", () => {
  const first = placeDiagram("data A = B\ndata B = string\ndata C = int\n");
  const next = placeDiagram(
    "// 移動\ndata C = int\ndata B = string\ndata A = B\n",
    Option.some(first.placement),
  );

  expect(modelPositions(next.placement)).toEqual(
    modelPositions(first.placement),
  );
  expect(next.layout.edges.map((edge) => edge.path)).toEqual(
    first.layout.edges.map((edge) => edge.path),
  );
  expect(next.layout.nodes.map((node) => node.id)).not.toEqual(
    first.layout.nodes.map((node) => node.id),
  );
  expect(next.layout.revision).toBe(next.diagram.graph.revision);
  expect(next.diagram.graph.revision).toBe(first.diagram.graph.revision + 1);
});

test("同じノード数でも参照先が変わると最新の接続で再配置する", () => {
  const first = placeDiagram("data A = B\ndata B = string\ndata C = int\n");
  const next = placeDiagram(
    "data A = C\ndata B = string\ndata C = int\n",
    Option.some(first.placement),
  );

  expect(next.layout.edges).toMatchObject(
    next.diagram.graph.edges.map(({ id, from, to }) => ({ id, from, to })),
  );
  expect(next.layout.edges[0].to).toBe(next.diagram.graph.nodes[2].id);
  expect(modelPositions(next.placement)).not.toEqual(
    modelPositions(first.placement),
  );
});

test("カードの寸法が変わると後続カードが重ならない位置へ配置し直す", () => {
  const first = placeDiagram("data A = string\ndata B = int\n");
  const sizes = new Map(first.sizes);
  sizes.set(first.diagram.cards[0].id, { width: 400, height: 500 });

  const next = DependencyPlacement.create(
    { diagram: first.diagram, sizes, attempt: 0 },
    Option.some(first.placement),
  );
  const nodes = expectPlacementLayout(next).nodes;

  expect(nodes[0]).toMatchObject({ width: 400, height: 500 });
  expect(nodes[1].y).toBeGreaterThan(nodes[0].y + nodes[0].height);
});

test("再配置を要求すると保持した配置を離れ、現在の宣言順で配置し直す", () => {
  const first = placeDiagram("data A = string\ndata B = int\n");
  const reordered = placeDiagram(
    "data B = int\ndata A = string\n",
    Option.some(first.placement),
  );
  const rearranged = placeDiagram(
    reordered.diagram.source,
    Option.some(reordered.placement),
    1,
  );

  expect(modelPositions(reordered.placement)).toEqual(
    modelPositions(first.placement),
  );
  expect(modelPositions(rearranged.placement)).not.toEqual(
    modelPositions(first.placement),
  );
  expect(rearranged.layout.nodes[0].id).toBe(
    rearranged.diagram.graph.nodes[0].id,
  );
});

test("寸法の欠落時は過去の配置を成功結果として流用しない", () => {
  const first = placeDiagram("data A = string\n");
  const next = DependencyPlacement.create(
    { diagram: first.diagram, sizes: new Map(), attempt: 0 },
    Option.some(first.placement),
  );

  expect(Result.isErr(next.result)).toBe(true);
});
