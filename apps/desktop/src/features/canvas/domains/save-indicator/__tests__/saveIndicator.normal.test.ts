import { expect, test } from "vitest";
import { SaveIndicator } from "../index";

test("保存済みのときは保存済みと表示する", () => {
  expect(SaveIndicator.create("saved").label).toBe("保存済み");
});

test("書き込み中のときは保存中と表示する", () => {
  expect(SaveIndicator.create("saving").label).toBe("保存中");
});

test("書き込み失敗のときは保存に失敗と表示する", () => {
  expect(SaveIndicator.create("failed").label).toBe("保存に失敗");
});
