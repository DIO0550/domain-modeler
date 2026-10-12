import { act } from "react";
import { expect, test } from "vitest";
import {
  renderDependencyNavigation,
  clickInspector,
} from "./modelDiagnostics.navigation.test-support";

test("定義を編集すると実エディタで選択した宣言全体を選択しフォーカスする", () => {
  const source = "data 商品 = string\ndata 注文 = 商品\n";
  const screen = renderDependencyNavigation(source);

  act(() =>
    screen.host.querySelectorAll<HTMLElement>("[data-node-id]")[1].click(),
  );
  clickInspector(screen.host, "定義を編集");
  const editor = screen.host.querySelector("textarea")!;

  expect(editor.value.slice(editor.selectionStart, editor.selectionEnd)).toBe(
    "data 注文 = 商品",
  );
  expect(document.activeElement).toBe(editor);
  expect(screen.host.querySelector(".dependency-view")).toBeNull();
  expect(editor.value).toBe(source);
  expect(screen.changes).toEqual([]);
  screen.unmount();
});

test("選択後に先頭へ行を追加しても定義と編集先は最新本文に一致する", () => {
  const source = "data 商品 = string\ndata 注文 = 商品\n";
  const screen = renderDependencyNavigation(source);

  act(() =>
    screen.host.querySelectorAll<HTMLElement>("[data-node-id]")[1].click(),
  );
  screen.render("// 先頭に追加\n\n" + source);

  expect(screen.host.querySelector("aside pre")!.textContent).toBe(
    "data 注文 = 商品",
  );
  clickInspector(screen.host, "定義を編集");
  const editor = screen.host.querySelector("textarea")!;

  expect(editor.selectionStart).toBe(editor.value.indexOf("data 注文"));
  expect(editor.value.slice(editor.selectionStart, editor.selectionEnd)).toBe(
    "data 注文 = 商品",
  );
  expect(document.activeElement).toBe(editor);
  screen.unmount();
});

test("重複名の2件目から編集すると定義表の先頭ではなくその宣言へ移動する", () => {
  const source = "data 注文 = string\ndata 注文 = int\n";
  const screen = renderDependencyNavigation(source);

  act(() =>
    screen.host.querySelectorAll<HTMLElement>("[data-node-id]")[1].click(),
  );
  clickInspector(screen.host, "定義を編集");
  const editor = screen.host.querySelector("textarea")!;

  expect(editor.value.slice(editor.selectionStart, editor.selectionEnd)).toBe(
    "data 注文 = int",
  );
  expect(editor.selectionStart).toBe(source.indexOf("data 注文 = int"));
  expect(document.activeElement).toBe(editor);
  screen.unmount();
});

test("未定義名には編集用の架空本文を出さず各役割の参照箇所へ移動できる", () => {
  const source =
    "workflow 更新 =\n  input: 未定義\n  output: 未定義\n  error: 未定義\n";
  const screen = renderDependencyNavigation(source);

  act(() =>
    screen.host
      .querySelector<HTMLElement>('[data-node-id][data-kind="未定義"]')!
      .click(),
  );

  expect(screen.host.querySelector("aside pre")).toBeNull();
  expect(screen.host.querySelector("aside")!.textContent).not.toContain(
    "定義を編集",
  );
  clickInspector(screen.host, "出力・未定義・行 3:11");
  const editor = screen.host.querySelector("textarea")!;

  expect(editor.value.slice(editor.selectionStart, editor.selectionEnd)).toBe(
    "未定義",
  );
  expect(editor.selectionStart).toBe(
    source.indexOf("未定義", source.indexOf("output:")),
  );
  expect(document.activeElement).toBe(editor);
  expect(screen.changes).toEqual([]);
  screen.unmount();
});
