import { act } from "react";
import { expect, test } from "vitest";
import { renderDependency } from "./dependencyView.test-support";

test("選択モデルの両方向の直接接続だけを強調し、推移先の線は強調しない", () => {
  const screen = renderDependency(
    "data 子 = string\ndata 商品 = 子\ndata 注文 = 商品\ndata 結果 = 注文\ndata 孤立 = int\n",
  );
  const nodes = [
    ...screen.host.querySelectorAll<HTMLElement>("[data-node-id]"),
  ];

  act(() => nodes[2].click());

  expect(nodes.map((node) => node.dataset.related)).toEqual([
    "false",
    "true",
    "true",
    "true",
    "false",
  ]);
  expect(
    [...screen.host.querySelectorAll<SVGGElement>("svg g")].map(
      (edge) => edge.dataset.related,
    ),
  ).toEqual(["false", "true", "true"]);

  act(() =>
    screen.host.querySelector<HTMLElement>(".dependency-view__canvas")!.click(),
  );

  expect(nodes.every((node) => node.dataset.related === "false")).toBe(true);
  screen.unmount();
});

test("図のキーボード選択をEscapeで解除できる", () => {
  const screen = renderDependency("data 注文 = string\n");
  const node = screen.host.querySelector<HTMLElement>("[data-node-id]")!;

  act(() =>
    node.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    ),
  );
  act(() =>
    node.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    ),
  );

  expect(node.getAttribute("aria-pressed")).toBe("false");
  expect(screen.host.querySelector("aside")!.textContent).toContain(
    "モデルを選択すると",
  );
  screen.unmount();
});
