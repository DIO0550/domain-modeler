import { expect, test } from "vitest";
import { EventTargetEx } from "../EventTargetEx";

test.each([document.createElement("textarea"), document.createElement("input")])(
  "テキスト入力要素を判定する",
  (target) => {
    expect(EventTargetEx.isTextEntry(target)).toBe(true);
  },
);

test("テキスト入力以外の要素は該当しない", () => {
  expect(EventTargetEx.isTextEntry(document.createElement("div"))).toBe(false);
  expect(EventTargetEx.isTextEntry(null)).toBe(false);
});
