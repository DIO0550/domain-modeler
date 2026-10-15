import { expect, test, vi } from "vitest";
import { ElementNavigation } from "..";

test("対象を縦横の可視範囲へスクロールしフォーカスする", () => {
  const target = document.createElement("button");
  document.body.append(target);
  const scroll = vi.spyOn(target, "scrollIntoView");

  ElementNavigation.reveal(target);

  expect(scroll).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
  expect(document.activeElement).toBe(target);
  scroll.mockRestore();
  target.remove();
});

test("取り外された要素でも移動操作は例外を投げない", () => {
  const target = document.createElement("button");

  expect(() => ElementNavigation.reveal(target)).not.toThrow();
});
