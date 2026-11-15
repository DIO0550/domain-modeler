import { expect, test } from "vitest";
import { Result, Serialize } from "..";
import { setupSerializedCanvas } from "./serialize.test-support";

test.each([
  null,
  [],
  "canvas",
  1,
  true,
])("文書全体がオブジェクトでない場合は読込を拒否する: %j", (value) => {
  expect(Result.unwrapErr(Serialize.parse(JSON.stringify(value))).code).toBe(
    "INVALID_DOCUMENT",
  );
});

test.each([
  undefined,
  null,
  1,
  {},
  [],
])("バージョンが文字列でない場合は読込を拒否する: %j", (version) => {
  const raw = { ...setupSerializedCanvas(), version };

  expect(Result.unwrapErr(Serialize.parse(JSON.stringify(raw))).code).toBe(
    "INVALID_VERSION",
  );
});

test.each([
  { field: "title", value: undefined },
  { field: "title", value: 123 },
  { field: "viewport", value: [] },
  { field: "viewport", value: { x: "0", y: 0, zoom: 1 } },
  { field: "viewport", value: { x: 0, y: null, zoom: 1 } },
  { field: "viewport", value: { x: 0, y: 0 } },
  { field: "stickies", value: {} },
  { field: "stickies", value: undefined },
  { field: "connections", value: {} },
  { field: "connections", value: undefined },
])("文書の必須フィールド $field の型が不正なら読込を拒否する: $value", ({
  field,
  value,
}) => {
  const raw = { ...setupSerializedCanvas(), [field]: value };

  expect(Result.unwrapErr(Serialize.parse(JSON.stringify(raw))).code).toBe(
    "INVALID_DOCUMENT",
  );
});

test.each([
  null,
  [],
  "sticky",
])("付箋がオブジェクトでない場合は文書全体の読込を拒否する: %j", (sticky) => {
  const raw = { ...setupSerializedCanvas(), stickies: [sticky] };

  expect(Result.unwrapErr(Serialize.parse(JSON.stringify(raw))).code).toBe(
    "INVALID_DOCUMENT",
  );
});

test.each([
  { field: "id", value: undefined },
  { field: "id", value: 123 },
  { field: "text", value: undefined },
  { field: "text", value: false },
  { field: "position", value: null },
  { field: "position", value: [] },
  { field: "position", value: { x: "0", y: 0 } },
  { field: "position", value: { x: 0 } },
  { field: "size", value: undefined },
  { field: "size", value: [] },
  { field: "size", value: { width: "160", height: 100 } },
  { field: "size", value: { width: 160, height: null } },
])("付箋の必須フィールド $field の型が不正なら読込を拒否する: $value", ({
  field,
  value,
}) => {
  const document = setupSerializedCanvas();
  const raw = {
    ...document,
    stickies: [{ ...document.stickies[0], [field]: value }],
    connections: [],
  };

  expect(Result.unwrapErr(Serialize.parse(JSON.stringify(raw))).code).toBe(
    "INVALID_DOCUMENT",
  );
});

test.each([
  null,
  [],
  "connection",
])("接続がオブジェクトでない場合は文書全体の読込を拒否する: %j", (connection) => {
  const raw = { ...setupSerializedCanvas(), connections: [connection] };

  expect(Result.unwrapErr(Serialize.parse(JSON.stringify(raw))).code).toBe(
    "INVALID_DOCUMENT",
  );
});

test.each([
  { field: "id", value: undefined },
  { field: "id", value: 1 },
  { field: "from", value: undefined },
  { field: "from", value: 1 },
  { field: "to", value: undefined },
  { field: "to", value: 1 },
  { field: "label", value: undefined },
  { field: "label", value: null },
])("接続の必須フィールド $field の型が不正なら読込を拒否する: $value", ({
  field,
  value,
}) => {
  const document = setupSerializedCanvas();
  const raw = {
    ...document,
    connections: [{ ...document.connections[0], [field]: value }],
  };

  expect(Result.unwrapErr(Serialize.parse(JSON.stringify(raw))).code).toBe(
    "INVALID_DOCUMENT",
  );
});

test.each([
  undefined,
  null,
  42,
  { old: "snapshot" },
])("接続の可読スナップショットは型にかかわらず無視して保存時に再生成する: %j", (note) => {
  const document = setupSerializedCanvas();
  const raw = {
    ...document,
    connections: [{ ...document.connections[0], note }],
  };
  const parsed = Result.unwrap(Serialize.parse(JSON.stringify(raw)));
  const reloaded = JSON.parse(Serialize.stringify(parsed));

  expect(reloaded.connections[0].note).toBe("注文する -> 注文された");
  expect(parsed.connections[0]?.note).toBe("");
});
