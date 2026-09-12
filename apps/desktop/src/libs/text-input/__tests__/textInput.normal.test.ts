import { afterEach, expect, test } from "vitest";
import { TextInput } from "../index";

afterEach(() => {
  document.body.replaceChildren();
});

test("入力欄以外にフォーカスがあっても置換後は入力欄がフォーカスされる", () => {
  const input = document.createElement("textarea");
  input.value = "data 注文 = 未定義型";
  const button = document.createElement("button");
  button.type = "button";
  document.body.append(input, button);
  button.focus();

  TextInput.applyEdit(input, {
    start: input.value.length,
    end: input.value.length,
    replacement: "\ndata 未定義型 = string // TODO 詳細化",
  });

  expect(document.activeElement).toBe(input);
  expect(input.value).toBe(
    "data 注文 = 未定義型\ndata 未定義型 = string // TODO 詳細化",
  );
});
