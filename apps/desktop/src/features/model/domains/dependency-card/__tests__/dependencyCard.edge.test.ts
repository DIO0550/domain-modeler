import { expect, test } from "vitest";
import { DependencyCard } from "..";
import { nodeFromSource } from "./dependencyCard.test-support";

test("未定義参照のカードに型や宣言本文を捏造しない", () => {
  const node = nodeFromSource({
    source: "data 注文 = 未定義名",
    name: "未定義名",
  });

  expect(DependencyCard.create(node)).toEqual({
    id: node.id,
    name: "未定義名",
    kind: "未定義",
    rows: [{ label: "警告", text: "定義がありません" }],
  });
});

test("カード生成は元の宣言・参照・診断を変更しない", () => {
  const node = nodeFromSource({
    source: "data 注文 = 注文 list option",
    name: "注文",
  });
  const original = structuredClone(node);

  DependencyCard.create(node);

  expect(node).toEqual(original);
});
