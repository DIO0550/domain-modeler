import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createDeclNameEditRenderer } from "./useDeclNameEdit.test-support";

const edits = createDeclNameEditRenderer();

afterEach(() => {
  edits.unmountAll();
});

test("同じ名前の確定ではリネームを通知しない", () => {
  const renamed: string[] = [];
  const latest = edits.render("注文ID", (nextName) => {
    renamed.push(nextName);
  });

  act(() => {
    latest.current?.start();
  });
  act(() => {
    latest.current?.submit("注文ID");
  });

  expect(renamed).toEqual([]);
  expect(latest.current?.edit).toEqual({ status: "idle" });
});

test("確定後の blur ではリネームを二重に通知しない", () => {
  const renamed: string[] = [];
  const latest = edits.render("注文ID", (nextName) => {
    renamed.push(nextName);
  });

  act(() => {
    latest.current?.start();
  });
  act(() => {
    latest.current?.submit("商品ID");
    latest.current?.blur("商品ID");
  });

  expect(renamed).toEqual(["商品ID"]);
});

test("取消後の blur ではリネームを通知しない", () => {
  const renamed: string[] = [];
  const latest = edits.render("注文ID", (nextName) => {
    renamed.push(nextName);
  });

  act(() => {
    latest.current?.start();
  });
  act(() => {
    latest.current?.changeDraft("商品ID");
    latest.current?.cancel();
    latest.current?.blur("商品ID");
  });

  expect(renamed).toEqual([]);
  expect(latest.current?.edit).toEqual({ status: "idle" });
});
