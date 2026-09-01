import { expect, test } from "vitest";
import { CanvasError } from "..";

test("コードとメッセージからキャンバスエラーを生成する", () => {
  expect(CanvasError.create("INVALID_DOCUMENT", "Document is invalid")).toEqual(
    {
      code: "INVALID_DOCUMENT",
      message: "Document is invalid",
    },
  );
});
