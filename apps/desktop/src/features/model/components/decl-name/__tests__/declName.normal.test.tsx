import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createNameRenderer } from "./declName.test-support";

const names = createNameRenderer();

afterEach(() => {
  names.unmountAll();
});

test("リネーム通知が無ければ名前をテキストで出す", () => {
  const host = names.render("注文ID");

  expect(host.querySelector("h2")?.textContent).toBe("注文ID");
  expect(host.querySelector("button")).toBeNull();
});

test("リネーム通知があるときは名前ボタンから新しい名前を通知する", () => {
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
    nameInput.form?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });

  expect(renamed).toEqual(["商品ID"]);
});
