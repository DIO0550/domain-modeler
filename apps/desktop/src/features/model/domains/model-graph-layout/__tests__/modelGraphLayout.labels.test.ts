import { expect, test } from "vitest";
import { ModelGraphLayout } from "..";
import {
  expectLayout,
  mixedSource,
  setup,
} from "./modelGraphLayout.test-support";

test("循環・自己参照を含む全経路のラベル位置を有限な座標で返す", () => {
  const layout = expectLayout(setup(mixedSource));

  const labels = layout.edges.map(ModelGraphLayout.labelPosition);

  expect(labels).toHaveLength(layout.edges.length);
  expect(
    labels.every(
      (label) => Number.isFinite(label.x) && Number.isFinite(label.y),
    ),
  ).toBe(true);
});

test("役割ラベルの基準位置をカード内部へ置かない", () => {
  const layout = expectLayout(setup(mixedSource));
  const labels = layout.edges.map(ModelGraphLayout.labelPosition);

  for (const label of labels) {
    expect(
      layout.nodes.some(
        (node) =>
          label.x > node.x &&
          label.x < node.x + node.width &&
          label.y > node.y &&
          label.y < node.y + node.height,
      ),
    ).toBe(false);
  }
});
