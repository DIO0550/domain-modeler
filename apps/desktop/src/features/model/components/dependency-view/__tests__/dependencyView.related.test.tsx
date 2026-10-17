import { act } from "react";
import { expect, test } from "vitest";
import { orderSource } from "../../../domains/dependency-selection/__tests__/dependencySelection.test-support";
import {
  modelNode,
  renderDependency,
  scopeButton,
  visibleNames,
  visibleRoutes,
} from "./dependencyView.test-support";

test("注文の関連のみへ切り替えると5ノード4辺を描画し、全文書の経路を維持する", () => {
  const screen = renderDependency(orderSource);
  const routes = visibleRoutes(screen.host);

  act(() => modelNode(screen.host, "注文").click());
  act(() => scopeButton(screen.host, "関連のみ").click());

  const relatedRoutes = visibleRoutes(screen.host);

  expect(visibleNames(screen.host)).toEqual([
    "注文ID",
    "顧客情報",
    "注文明細",
    "注文",
    "注文を確定する",
  ]);
  expect(relatedRoutes.map((route) => route.label)).toEqual([
    "注文 → 注文ID: 構成要素",
    "注文 → 顧客情報: 構成要素",
    "注文 → 注文明細: 構成要素",
    "注文を確定する → 注文: 入力",
  ]);
  expect(relatedRoutes).toEqual(
    routes.filter((route) =>
      relatedRoutes.some((related) => related.label === route.label),
    ),
  );
  screen.unmount();
});

test("関連のみ表示で別モデルを選ぶと、そのモデルの直接近傍へ更新する", () => {
  const screen = renderDependency(orderSource);

  act(() => modelNode(screen.host, "注文").click());
  act(() => scopeButton(screen.host, "関連のみ").click());
  act(() => modelNode(screen.host, "注文明細").click());

  expect(visibleNames(screen.host)).toEqual([
    "商品ID",
    "数量",
    "注文明細",
    "注文",
  ]);
  expect(screen.host.querySelectorAll("svg g")).toHaveLength(3);
  expect(modelNode(screen.host, "注文明細").getAttribute("aria-pressed")).toBe(
    "true",
  );
  expect(
    scopeButton(screen.host, "関連のみ").getAttribute("aria-pressed"),
  ).toBe("true");
  screen.unmount();
});

test("全体へ戻すと選択とカード位置を維持し、全ノードと全辺が復帰する", () => {
  const screen = renderDependency(orderSource);
  const position = modelNode(screen.host, "注文").getAttribute("style");
  const routes = visibleRoutes(screen.host);

  act(() => modelNode(screen.host, "注文").click());
  act(() => scopeButton(screen.host, "関連のみ").click());
  act(() => scopeButton(screen.host, "全体").click());

  expect(screen.host.querySelectorAll("[data-node-id]")).toHaveLength(9);
  expect(visibleRoutes(screen.host)).toEqual(routes);
  expect(modelNode(screen.host, "注文").getAttribute("aria-pressed")).toBe(
    "true",
  );
  expect(modelNode(screen.host, "注文").getAttribute("style")).toBe(position);
  screen.unmount();
});

test("インスペクターの参照項目からも関連のみ表示が選択先に追従する", () => {
  const screen = renderDependency(orderSource);

  act(() => modelNode(screen.host, "注文").click());
  act(() => scopeButton(screen.host, "関連のみ").click());

  const reference = [
    ...screen.host.querySelectorAll<HTMLButtonElement>("aside button"),
  ].find((button) => button.textContent === "注文明細")!;

  act(() => reference.click());

  expect(visibleNames(screen.host)).toEqual([
    "商品ID",
    "数量",
    "注文明細",
    "注文",
  ]);
  expect(modelNode(screen.host, "注文明細").getAttribute("aria-pressed")).toBe(
    "true",
  );
  screen.unmount();
});

test.each([
  "blank",
  "Escape",
])("関連のみ表示中の選択解除で全体表示へ戻る: %s", (operation) => {
  const screen = renderDependency(orderSource);

  act(() => modelNode(screen.host, "注文").click());
  act(() => scopeButton(screen.host, "関連のみ").click());

  const canvas = screen.host.querySelector<HTMLElement>(
    ".dependency-view__canvas",
  )!;

  act(() =>
    canvas.dispatchEvent(
      operation === "blank"
        ? new MouseEvent("click", { bubbles: true })
        : new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    ),
  );

  expect(screen.host.querySelectorAll("[data-node-id]")).toHaveLength(9);
  expect(screen.host.querySelectorAll("svg g")).toHaveLength(9);
  expect(scopeButton(screen.host, "全体").getAttribute("aria-pressed")).toBe(
    "true",
  );
  expect(
    scopeButton(screen.host, "関連のみ").getAttribute("aria-disabled"),
  ).toBe("true");
  expect(
    screen.host.querySelector('[data-node-id][aria-pressed="true"]'),
  ).toBeNull();
  screen.unmount();
});

test("対象削除で全体へ戻り、対象が再追加されても関連のみや選択を復活させない", () => {
  const screen = renderDependency(orderSource);

  act(() => modelNode(screen.host, "注文").click());
  act(() => scopeButton(screen.host, "関連のみ").click());
  screen.render("data 商品 = string\ndata 金額 = int\n");

  expect(visibleNames(screen.host)).toEqual(["商品", "金額"]);
  expect(scopeButton(screen.host, "全体").getAttribute("aria-pressed")).toBe(
    "true",
  );
  expect(
    scopeButton(screen.host, "関連のみ").getAttribute("aria-disabled"),
  ).toBe("true");

  screen.render(orderSource);

  expect(
    scopeButton(screen.host, "関連のみ").getAttribute("aria-disabled"),
  ).toBe("true");
  expect(screen.host.querySelectorAll("[data-node-id]")).toHaveLength(9);
  screen.unmount();
});

test("本文更新で選択が残る場合は、新しい直接の関連だけを表示する", () => {
  const screen = renderDependency(
    "data 注文 = ID\ndata ID = string\ndata 金額 = int\n",
  );

  act(() => modelNode(screen.host, "注文").click());
  act(() => scopeButton(screen.host, "関連のみ").click());
  screen.render("data 注文 = 金額\ndata ID = string\ndata 金額 = int\n");

  expect(visibleNames(screen.host)).toEqual(["注文", "金額"]);
  expect(screen.host.querySelectorAll("svg g")).toHaveLength(1);
  expect(
    scopeButton(screen.host, "関連のみ").getAttribute("aria-pressed"),
  ).toBe("true");
  screen.unmount();
});

test("未定義モデルの関連のみ表示から参照元へ選択を移動できる", () => {
  const screen = renderDependency("data A = 不明\ndata B = 不明\ndata C = A\n");

  act(() => modelNode(screen.host, "不明").click());
  act(() => scopeButton(screen.host, "関連のみ").click());

  expect(visibleNames(screen.host)).toEqual(["A", "不明", "B"]);
  expect(
    screen.host.querySelectorAll('svg g[data-unresolved="true"]'),
  ).toHaveLength(2);

  act(() => modelNode(screen.host, "A").click());

  expect(visibleNames(screen.host)).toEqual(["A", "不明", "C"]);
  screen.unmount();
});

test("自己ループの関連のみ表示でもノードと線が重複しない", () => {
  const screen = renderDependency("data 木 = 木 list\ndata 孤立 = string\n");

  act(() => modelNode(screen.host, "木").click());
  act(() => scopeButton(screen.host, "関連のみ").click());

  expect(visibleNames(screen.host)).toEqual(["木"]);
  expect(screen.host.querySelectorAll("svg g")).toHaveLength(1);
  screen.unmount();
});
