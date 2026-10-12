import { act } from "react";
import { expect, test } from "vitest";
import { DependencyGraph } from "..";
import {
  renderContent,
  renderDependency,
  waitingSizes,
} from "../../__tests__/dependencyView.test-support";

test("計測完了前は未計測のカードを図として公開しない", () => {
  const screen = renderDependency("data 注文 = string", {
    children: <DependencyGraph />,
    observeSizes: waitingSizes,
  });

  expect(screen.host.querySelector('[role="status"]')!.textContent).toContain(
    "カードを計測しています",
  );
  expect(screen.host.querySelector('[role="button"]')).toBeNull();
  expect(
    screen.host.querySelector("[aria-hidden=true]")!.hasAttribute("inert"),
  ).toBe(true);
  screen.unmount();
});

test("Spaceでカードを選択し、図の空白クリックで解除する", () => {
  const screen = renderDependency("data 注文 = string", {
    children: <DependencyGraph />,
  });
  const node = screen.host.querySelector<HTMLElement>('[role="button"]')!;

  act(() =>
    node.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    ),
  );

  expect(node.getAttribute("aria-pressed")).toBe("true");

  act(() =>
    screen.host
      .querySelector<HTMLElement>(".dependency-view__drawing")!
      .click(),
  );

  expect(node.getAttribute("aria-pressed")).toBe("false");
  screen.unmount();
});

test.each([
  { key: "Enter", isComposing: true },
  { key: "a", isComposing: false },
])("変換中のEnterと無関係なキーで選択を変えない: $key/$isComposing", ({
  key,
  isComposing,
}) => {
  const screen = renderDependency("data 注文 = string", {
    children: <DependencyGraph />,
  });
  const node = screen.host.querySelector<HTMLElement>('[role="button"]')!;

  act(() =>
    node.dispatchEvent(
      new KeyboardEvent("keydown", { key, isComposing, bubbles: true }),
    ),
  );

  expect(node.getAttribute("aria-pressed")).toBe("false");
  screen.unmount();
});

test("Rootの外では空文書や配置失敗と誤認させる表示を出さない", () => {
  const screen = renderContent(<DependencyGraph />);

  expect(screen.host.textContent).toBe("");
  screen.unmount();
});
