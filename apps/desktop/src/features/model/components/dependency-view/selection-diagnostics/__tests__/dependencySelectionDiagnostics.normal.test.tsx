import { act } from "react";
import { expect, test } from "vitest";
import type { SourceRange } from "@domain-modeler/model-core";
import { DependencySelectionDiagnostics } from "..";
import {
  renderDependency,
  renderContent,
} from "../../__tests__/dependencyView.test-support";

test("選択モデルの警告から参照箇所へ移動できる", () => {
  const opened: (SourceRange | undefined)[] = [];
  const screen = renderDependency("data 注文 = 未定義\n", {
    onEditSource: (range) => opened.push(range),
  });

  act(() => screen.host.querySelector<HTMLElement>("[data-node-id]")!.click());
  act(() =>
    screen.host
      .querySelector<HTMLButtonElement>(
        'section[aria-label="選択モデルの診断"] button',
      )!
      .click(),
  );

  expect(opened).toEqual([
    { startLine: 1, startColumn: 11, endLine: 1, endColumn: 14 },
  ]);
  screen.unmount();
});

test("診断がない選択モデルにはなしを表示する", () => {
  const screen = renderDependency("data 注文 = string\n");

  act(() => screen.host.querySelector<HTMLElement>("[data-node-id]")!.click());

  expect(
    screen.host.querySelector('section[aria-label="選択モデルの診断"]')!
      .textContent,
  ).toBe("診断なし");
  screen.unmount();
});

test("Rootの外では選択診断を表示しない", () => {
  const screen = renderContent(
    <DependencySelectionDiagnostics diagnostics={[]} />,
  );

  expect(screen.host.textContent).toBe("");
  screen.unmount();
});
