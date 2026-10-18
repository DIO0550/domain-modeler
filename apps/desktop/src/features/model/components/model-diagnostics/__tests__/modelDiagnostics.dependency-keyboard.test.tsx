import { composeStories } from "@storybook/react-vite";
import { afterEach, expect, test, vi } from "vitest";
import * as stories from "../ModelDiagnostics.stories";

const { DependencyKeyboard } = composeStories(stories);

afterEach(() => vi.restoreAllMocks());

test("UI-07: 同じフォーカスからTab・Enter・Spaceで関連表示と定義編集を往復できる", async () => {
  vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(() => new DOMRect(0, 0, 1000, 700));

  await DependencyKeyboard.run();

  expect(
    document.querySelector(
      '[data-node-id][aria-pressed="true"] .dependency-view__name',
    )!.textContent,
  ).toBe("商品");
});
