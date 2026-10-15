import { act } from "react";
import { expect, test } from "vitest";
import { DependencyToolbar } from "..";
import {
  modelNode,
  renderContent,
  renderDependency,
  scopeButton,
} from "../../__tests__/dependencyView.test-support";

test("初回は全体を選択し、未選択では関連のみボタンを無効にする", () => {
  const screen = renderDependency("data 注文 = string\n");

  expect(scopeButton(screen.host, "全体").getAttribute("aria-pressed")).toBe(
    "true",
  );
  expect(
    scopeButton(screen.host, "関連のみ").getAttribute("aria-disabled"),
  ).toBe("true");
  screen.unmount();
});

test("選択後に関連のみを押すと選択中の範囲を表示する", () => {
  const screen = renderDependency("data 注文 = string\ndata 他 = int\n");

  act(() => modelNode(screen.host, "注文").click());

  expect(
    scopeButton(screen.host, "関連のみ").getAttribute("aria-disabled"),
  ).toBe("false");

  act(() => scopeButton(screen.host, "関連のみ").click());

  expect(scopeButton(screen.host, "全体").getAttribute("aria-pressed")).toBe(
    "false",
  );
  expect(
    scopeButton(screen.host, "関連のみ").getAttribute("aria-pressed"),
  ).toBe("true");
  expect(screen.host.querySelector('[aria-live="polite"]')!.textContent).toBe(
    "1モデル・0接続",
  );
  screen.unmount();
});

test("Rootの外では別の図を操作する切替を表示しない", () => {
  const screen = renderContent(<DependencyToolbar />);

  expect(screen.host.textContent).toBe("");
  screen.unmount();
});

test("未選択の関連のみボタンを押しても表示範囲は変わらない", () => {
  const screen = renderDependency("data 注文 = string\ndata 他 = int\n");

  act(() => scopeButton(screen.host, "関連のみ").click());

  expect(scopeButton(screen.host, "全体").getAttribute("aria-pressed")).toBe(
    "true",
  );
  expect(screen.host.querySelectorAll("[data-node-id]")).toHaveLength(2);
  expect(scopeButton(screen.host, "関連のみ").tabIndex).toBe(-1);
  screen.unmount();
});
