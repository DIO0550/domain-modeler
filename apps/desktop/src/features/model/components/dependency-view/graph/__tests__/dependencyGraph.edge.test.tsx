import { act } from "react";
import { expect, test } from "vitest";
import type { SourceRange } from "@domain-modeler/model-core";
import { DependencyGraph } from "..";
import {
  createRetrySizes,
  renderDependency,
} from "../../__tests__/dependencyView.test-support";

test.each([
  "",
  "state-machine 処理 =\n  initial: 待機\n  state: 待機\n",
])("対象宣言がない本文に架空のカードを出さない: %s", (source) => {
  const screen = renderDependency(source, { children: <DependencyGraph /> });

  expect(screen.host.querySelector('[role="status"]')!.textContent).toContain(
    "表示できるdata・workflowがありません",
  );
  expect(screen.host.querySelector('[role="button"]')).toBeNull();
  screen.unmount();
});

test("配置に失敗しても理由を表示し、定義画面への移動を提供する", () => {
  const opened: (SourceRange | undefined)[] = [];
  const screen = renderDependency("data 注文 = string", {
    children: <DependencyGraph />,
    observeSizes: createRetrySizes(),
    onEditSource: (range) => opened.push(range),
  });
  const alert = screen.host.querySelector('[role="alert"]')!;

  expect(alert.textContent).toContain("依存図を配置できませんでした");
  expect(alert.textContent).toContain("未計測");

  act(() => alert.querySelectorAll<HTMLButtonElement>("button")[1].click());

  expect(opened).toEqual([undefined]);
  screen.unmount();
});
