import { act } from "react";
import { afterEach, test, expect } from "vitest";
import { createDiagnosticsRenderer } from "./modelDiagnostics.test-support";

const renderer = createDiagnosticsRenderer();

afterEach(() => renderer.unmountAll());

test("初回は定義とプレビューを表示し、依存図への切替は本文を変更しない", () => {
  const changes: string[] = [];
  const source = "data 注文 = string\n";
  const host = renderer.render(source, (text) => changes.push(text));
  const modelViews = host.querySelectorAll<HTMLButtonElement>(
    'nav[aria-label="モデルの表示"] button',
  );

  expect(host.querySelector("textarea")!.value).toBe(source);
  expect(modelViews[0].getAttribute("aria-current")).toBe("page");

  act(() => modelViews[1].click());

  expect(host.querySelector(".dependency-view")).not.toBeNull();
  expect(host.querySelector("textarea")).toBeNull();

  act(() => modelViews[0].click());

  expect(host.querySelector("textarea")!.value).toBe(source);
  expect(changes).toEqual([]);
});

test("依存図とステートマシンを往復しても既存画面を使え、モデルの表示選択を維持する", () => {
  const source =
    "data 注文 = string\nstate-machine 処理 =\n  initial: 待機\n  state: 待機\n";
  const host = renderer.render(source);
  const modeButtons = host.querySelectorAll<HTMLButtonElement>(
    'nav[aria-label="表示モード"] button',
  );

  act(() =>
    host
      .querySelectorAll<HTMLButtonElement>(
        'nav[aria-label="モデルの表示"] button',
      )[1]
      .click(),
  );
  act(() => modeButtons[1].click());

  expect(host.querySelector(".state-machine-screen")).not.toBeNull();
  expect(host.querySelector('nav[aria-label="モデルの表示"]')).toBeNull();

  act(() => modeButtons[0].click());

  expect(host.querySelector(".dependency-view")).not.toBeNull();
});

test("依存図から定義へ戻るとエディタの選択とフォーカスを復元する", () => {
  const host = renderer.render("data 注文 = string\n");
  const input = host.querySelector("textarea")!;

  input.focus();
  input.setSelectionRange(5, 7);

  const modelViews = host.querySelectorAll<HTMLButtonElement>(
    'nav[aria-label="モデルの表示"] button',
  );

  act(() => modelViews[1].click());
  act(() => modelViews[0].click());

  const restored = host.querySelector("textarea")!;

  expect(restored.selectionStart).toBe(5);
  expect(restored.selectionEnd).toBe(7);
  expect(document.activeElement).toBe(restored);
});
