import { expect, test } from "vitest";
import { TextInput } from "..";

test.each([
  ["CRLF", "data 注文ID = string\r\ndata 注文 = 注文ID", "data 注文ID = string\ndata 注文 = 注文ID"],
  ["CR", "data 注文ID = string\rdata 注文 = 注文ID", "data 注文ID = string\ndata 注文 = 注文ID"],
  ["LF", "data 注文ID = string\ndata 注文 = 注文ID", "data 注文ID = string\ndata 注文 = 注文ID"],
])("%s の改行は入力欄の API 値と同じ LF になる", (_label, source, expected) => {
  expect(TextInput.toApiValue(source)).toBe(expected);
});
