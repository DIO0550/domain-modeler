import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createDeclNameEditRenderer } from "./useDeclNameEdit.test-support";

const edits = createDeclNameEditRenderer();

afterEach(() => {
  edits.unmountAll();
});

test("開始すると今の名前を下書きにした編集中になる", () => {
  const latest = edits.render("注文ID");

  act(() => {
    latest.current?.start();
  });

  expect(latest.current?.edit).toEqual({
    status: "editing",
    draft: "注文ID",
  });
});

test("確定すると新しい名前を通知して待機に戻る", () => {
  const renamed: string[] = [];
  const latest = edits.render("注文ID", (nextName) => {
    renamed.push(nextName);
  });

  act(() => {
    latest.current?.start();
  });
  act(() => {
    latest.current?.changeDraft("商品ID");
    latest.current?.submit("商品ID");
  });

  expect(renamed).toEqual(["商品ID"]);
  expect(latest.current?.edit).toEqual({ status: "idle" });
});
