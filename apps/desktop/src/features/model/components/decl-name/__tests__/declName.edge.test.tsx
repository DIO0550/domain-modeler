import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createNameRenderer } from "./declName.test-support";

const names = createNameRenderer();

afterEach(() => {
  names.unmountAll();
});

test("同じ名前の確定ではリネームを通知しない", () => {
  const renamed: string[] = [];
  const host = names.render("注文ID", (nextName) => {
    renamed.push(nextName);
  });
  const button = host.querySelector('button[aria-label="「注文ID」をリネーム"]');

  act(() => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const input = host.querySelector('input[aria-label="新しい名前"]');
  const nameInput =
    input instanceof HTMLInputElement ? input : document.createElement("input");
  act(() => {
    nameInput.form?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });

  expect(renamed).toEqual([]);
  expect(host.querySelector("button")?.textContent).toBe("注文ID");
});

test("Escape ではリネームせず編集を終える", () => {
  const renamed: string[] = [];
  const host = names.render("注文ID", (nextName) => {
    renamed.push(nextName);
  });
  const button = host.querySelector('button[aria-label="「注文ID」をリネーム"]');

  act(() => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const input = host.querySelector('input[aria-label="新しい名前"]');
  const nameInput =
    input instanceof HTMLInputElement ? input : document.createElement("input");
  act(() => {
    nameInput.value = "商品ID";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    nameInput.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });

  expect(renamed).toEqual([]);
  expect(host.querySelector("button")?.textContent).toBe("注文ID");
});
