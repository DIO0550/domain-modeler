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

test("選択範囲を指定するとその区間が選ばれる", () => {
  const input = document.createElement("textarea");
  input.value = "data 名前 = string";
  document.body.append(input);
  const start = input.value.indexOf("名前");
  const end = start + "名前".length;

  TextInput.select(input, { start, end, line: 1 });

  expect(document.activeElement).toBe(input);
  expect([input.selectionStart, input.selectionEnd]).toEqual([start, end]);
});
