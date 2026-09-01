import { expect, test } from "vitest";
import { Document } from "./domains/document";
import { History } from "./domains/history";
import { Result } from "./domains/result";
import { ExternalChanges } from "./externalChanges";

test("不正な JSON は取り込みを拒否し History を変えない", () => {
  const history = History.create(Document.empty("初期"));

  const result = ExternalChanges.apply(history, "{ not json");

  expect(Result.unwrapErr(result).code).toBe("INVALID_JSON");
  expect(result.ok).toBe(false);
  expect(history.current.title).toBe("初期");
  expect(history.undoStack).toEqual([]);
});

test("必須フィールド欠落は取り込みを拒否し History を変えない", () => {
  const history = History.create(Document.empty("初期"));
  const invalid = JSON.stringify({
    version: "1.0",
    title: "",
    stickies: [],
    connections: [],
  });

  const result = ExternalChanges.apply(history, invalid);

  expect(Result.unwrapErr(result).code).toBe("INVALID_DOCUMENT");
  expect(history.current).toEqual(Document.empty("初期"));
  expect(history.undoStack).toEqual([]);
});

test("version major 不一致は取り込みを拒否し History を変えない", () => {
  const history = History.create(Document.empty("初期"));
  const invalid = JSON.stringify({
    version: "2.0",
    title: "新版",
    viewport: { x: 0, y: 0, zoom: 1 },
    stickies: [],
    connections: [],
  });

  const result = ExternalChanges.apply(history, invalid);

  expect(Result.unwrapErr(result).code).toBe("VERSION_MAJOR_MISMATCH");
  expect(history.current.title).toBe("初期");
  expect(history.undoStack).toEqual([]);
});
