import { act } from "react";
import { test, expect } from "vitest";
import type { SourceRange } from "@domain-modeler/model-core";
import {
  createRetrySizes,
  renderDependency,
} from "./dependencyView.test-support";

test.each([
  "",
  "state-machine 処理 =\n  initial: 待機\n  state: 待機\n",
])("dataとworkflowがなければ空表示から定義へ戻れる: %s", (source) => {
  const opened: (SourceRange | undefined)[] = [];
  const screen = renderDependency(source, {
    onEditSource: (range) => opened.push(range),
  });

  expect(screen.host.textContent).toContain(
    "表示できるdata・workflowがありません",
  );

  act(() =>
    screen.host.querySelector<HTMLButtonElement>("section button")!.click(),
  );

  expect(opened).toEqual([undefined]);
  screen.unmount();
});

test("部分構文エラーでも同じ本文の正常宣言を描画し、診断から該当行を開く", () => {
  const opened: (SourceRange | undefined)[] = [];
  const screen = renderDependency("data =\ndata 注文 = string\n", {
    onEditSource: (range) => opened.push(range),
  });

  expect(
    screen.host.querySelectorAll("[role=button][data-node-id]"),
  ).toHaveLength(1);
  expect(screen.host.textContent).toContain("エラー・行 1");

  act(() =>
    screen.host.querySelector<HTMLButtonElement>("details button")!.click(),
  );

  expect(opened[0]?.startLine).toBe(1);
  screen.unmount();
});

test("未定義は通常宣言と別のカード・警告・破線を持つ", () => {
  const screen = renderDependency("data 注文 = 未定義型\n");
  const unresolved = screen.host.querySelector(
    '[role=button][data-kind="未定義"]',
  )!;

  expect(unresolved.textContent).toContain("警告定義がありません");
  expect(
    screen.host
      .querySelector('svg g[data-unresolved="true"]')!
      .getAttribute("aria-label"),
  ).toContain("（未定義）");
  expect(screen.host.querySelector("details")!.textContent).toContain("警告");
  screen.unmount();
});

test("配置失敗を表示し、再試行で再計測して復旧する", () => {
  const screen = renderDependency("data 注文 = string\n", {
    observeSizes: createRetrySizes(),
  });

  expect(screen.host.querySelector("[role=alert]")!.textContent).toContain(
    "依存図を配置できませんでした",
  );

  act(() =>
    screen.host
      .querySelector<HTMLButtonElement>("[role=alert] button")!
      .click(),
  );

  expect(screen.host.querySelector("[role=alert]")).toBeNull();
  expect(
    screen.host.querySelector("[role=button][data-node-id]")!.textContent,
  ).toContain("注文");
  screen.unmount();
});

test("本文更新後に以前のカードを最新本文の図として残さない", () => {
  const screen = renderDependency("data 旧注文 = string\n");

  screen.render("data =\ndata 新注文 = int\n");

  expect(
    screen.host.querySelector(".dependency-view__drawing")!.textContent,
  ).toContain("新注文");
  expect(screen.host.textContent).not.toContain("旧注文");
  expect(screen.host.querySelector("details")!.textContent).toContain("行 1");
  screen.unmount();
});
