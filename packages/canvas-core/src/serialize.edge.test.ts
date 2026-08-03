import { expect, test } from "vitest";
import { Serialize } from "./serialize";
import { Result } from "./domain/result";

const baseDocument = (): Record<string, unknown> => ({
  version: "1.0",
  title: "",
  viewport: { x: 0, y: 0, zoom: 1 },
  stickies: [
    {
      id: "stk_aaaaaaaaaaaa",
      type: "command",
      text: "a",
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    },
    {
      id: "stk_bbbbbbbbbbbb",
      type: "event",
      text: "b",
      position: { x: 20, y: 0 },
      size: { width: 10, height: 10 },
    },
  ],
  connections: [],
});

test("不正な JSON は INVALID_JSON になる", () => {
  const error = Result.unwrapErr(Serialize.parse("{ not json"));

  expect(error.code).toBe("INVALID_JSON");
});

test.each([
  { version: "2.0", label: "major 不一致" },
  { version: "0.1", label: "major が小さい" },
  { version: "10.0", label: "major が大きい" },
])(
  "version の $label ($version) は VERSION_MAJOR_MISMATCH になる",
  ({ version }: { version: string; label: string }) => {
    const error = Result.unwrapErr(
      Serialize.parse(
        JSON.stringify({
          ...baseDocument(),
          version,
        }),
      ),
    );

    expect(error.code).toBe("VERSION_MAJOR_MISMATCH");
  },
);

test.each(["1", "1.0.0", "v1.0", "", "abc"])(
  "version 形式が不正な %s は INVALID_VERSION になる",
  (version: string) => {
    const error = Result.unwrapErr(
      Serialize.parse(
        JSON.stringify({
          ...baseDocument(),
          version,
        }),
      ),
    );

    expect(error.code).toBe("INVALID_VERSION");
  },
);

test("付箋 ID が重複すると DUPLICATE_STICKY_ID になる", () => {
  const document = baseDocument();
  document.stickies = [
    {
      id: "stk_aaaaaaaaaaaa",
      type: "command",
      text: "a",
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    },
    {
      id: "stk_aaaaaaaaaaaa",
      type: "event",
      text: "b",
      position: { x: 20, y: 0 },
      size: { width: 10, height: 10 },
    },
  ];

  const error = Result.unwrapErr(Serialize.parse(JSON.stringify(document)));

  expect(error.code).toBe("DUPLICATE_STICKY_ID");
});

test("接続 ID が重複すると DUPLICATE_CONNECTION_ID になる", () => {
  const document = baseDocument();
  document.connections = [
    {
      id: "con_cccccccccccc",
      from: "stk_aaaaaaaaaaaa",
      to: "stk_bbbbbbbbbbbb",
      label: "",
      note: "",
    },
    {
      id: "con_cccccccccccc",
      from: "stk_bbbbbbbbbbbb",
      to: "stk_aaaaaaaaaaaa",
      label: "",
      note: "",
    },
  ];

  const error = Result.unwrapErr(Serialize.parse(JSON.stringify(document)));

  expect(error.code).toBe("DUPLICATE_CONNECTION_ID");
});

test("接続の from が存在しない付箋を指すと CONNECTION_SOURCE_NOT_FOUND になる", () => {
  const document = baseDocument();
  document.connections = [
    {
      id: "con_cccccccccccc",
      from: "stk_missingxxxxx",
      to: "stk_bbbbbbbbbbbb",
      label: "",
      note: "",
    },
  ];

  const error = Result.unwrapErr(Serialize.parse(JSON.stringify(document)));

  expect(error.code).toBe("CONNECTION_SOURCE_NOT_FOUND");
});

test("接続の to が存在しない付箋を指すと CONNECTION_TARGET_NOT_FOUND になる", () => {
  const document = baseDocument();
  document.connections = [
    {
      id: "con_cccccccccccc",
      from: "stk_aaaaaaaaaaaa",
      to: "stk_missingxxxxx",
      label: "",
      note: "",
    },
  ];

  const error = Result.unwrapErr(Serialize.parse(JSON.stringify(document)));

  expect(error.code).toBe("CONNECTION_TARGET_NOT_FOUND");
});

test("自己参照の接続は SELF_REFERENTIAL_CONNECTION になる", () => {
  const document = baseDocument();
  document.connections = [
    {
      id: "con_cccccccccccc",
      from: "stk_aaaaaaaaaaaa",
      to: "stk_aaaaaaaaaaaa",
      label: "",
      note: "",
    },
  ];

  const error = Result.unwrapErr(Serialize.parse(JSON.stringify(document)));

  expect(error.code).toBe("SELF_REFERENTIAL_CONNECTION");
});

test("未知の付箋種別は INVALID_STICKY_TYPE になる", () => {
  const document = baseDocument();
  document.stickies = [
    {
      id: "stk_aaaaaaaaaaaa",
      type: "unknownType",
      text: "a",
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    },
  ];

  const error = Result.unwrapErr(Serialize.parse(JSON.stringify(document)));

  expect(error.code).toBe("INVALID_STICKY_TYPE");
});

test.each([
  { width: 0, height: 10 },
  { width: -1, height: 10 },
  { width: 10, height: 0 },
  { width: 10, height: -5 },
])(
  "不正なサイズ width=$width height=$height は INVALID_STICKY_SIZE になる",
  ({ width, height }: { width: number; height: number }) => {
    const document = baseDocument();
    document.stickies = [
      {
        id: "stk_aaaaaaaaaaaa",
        type: "event",
        text: "a",
        position: { x: 0, y: 0 },
        size: { width, height },
      },
    ];

    const error = Result.unwrapErr(Serialize.parse(JSON.stringify(document)));

    expect(error.code).toBe("INVALID_STICKY_SIZE");
  },
);

test.each([
  { field: "fromAnchor", value: "middle" },
  { field: "toAnchor", value: "center" },
])(
  "不正な $field=$value は INVALID_ANCHOR になる",
  ({ field, value }: { field: string; value: string }) => {
    const document = baseDocument();
    document.connections = [
      {
        id: "con_cccccccccccc",
        from: "stk_aaaaaaaaaaaa",
        to: "stk_bbbbbbbbbbbb",
        label: "",
        note: "",
        [field]: value,
      },
    ];

    const error = Result.unwrapErr(Serialize.parse(JSON.stringify(document)));

    expect(error.code).toBe("INVALID_ANCHOR");
  },
);

test("必須フィールド欠落は INVALID_DOCUMENT になる", () => {
  const error = Result.unwrapErr(
    Serialize.parse(
      JSON.stringify({
        version: "1.0",
        title: "",
        stickies: [],
        connections: [],
      }),
    ),
  );

  expect(error.code).toBe("INVALID_DOCUMENT");
});
