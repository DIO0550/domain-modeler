import { expect, test } from "vitest";
import { TextEdit } from "..";

test("Tab入力は選択位置へスペース2個を挿入する", () => {
  const text = "data Order = string";
  const edit = TextEdit.insertTab({ start: 5, end: 5 });
  expect(TextEdit.apply(text, edit)).toBe("data   Order = string");
});

test("Tab入力は選択範囲をスペース2個へ置き換える", () => {
  const text = "data Order = string";
  const edit = TextEdit.insertTab({ start: 5, end: 10 });
  expect(TextEdit.apply(text, edit)).toBe("data    = string");
});

test("改行入力は現在行のスペースによるインデントを引き継ぐ", () => {
  const text = "data Order =\n  OrderId AND Customer";
  const edit = TextEdit.insertLineBreak({
    text,
    start: text.length,
    end: text.length,
  });
  expect(TextEdit.apply(text, edit)).toBe(
    "data Order =\n  OrderId AND Customer\n  ",
  );
});

test("改行入力はタブを含む行頭空白をそのまま引き継ぐ", () => {
  const text = "data Order =\n\t OrderId";
  const edit = TextEdit.insertLineBreak({
    text,
    start: text.length,
    end: text.length,
  });
  expect(TextEdit.apply(text, edit)).toBe("data Order =\n\t OrderId\n\t ");
});

test("改行入力は選択範囲を改行と現在行のインデントへ置き換える", () => {
  const text = "data Order =\n  OrderId AND Customer";
  const start = text.indexOf("OrderId");
  const end = text.indexOf(" AND");
  const edit = TextEdit.insertLineBreak({ text, start, end });
  expect(TextEdit.apply(text, edit)).toBe("data Order =\n  \n   AND Customer");
});
