import { Generate } from "@domain-modeler/scaffold";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ScaffoldAction } from "../index";
import { setupScaffoldAction } from "./scaffoldAction.test-support";

test("確認した全文を新規保存し元キャンバスを残してモデルタブを前面に開く", async () => {
  const state = setupScaffoldAction();
  const result = await ScaffoldAction.run(state.source, state.operations);
  const text = Generate.toDmodelText(
    state.source.activeDocument.value.document,
    state.source.generatedOn,
  );
  expect(result).toEqual({ status: "created", path: "/generated.dmodel" });
  expect(state.previews).toEqual([text]);
  expect(state.files.get("/generated.dmodel")).toBe(text);
  expect(state.files.get("/source.dcanvas")).toBe("original canvas");
  expect(state.openedTabs).toEqual([
    { path: "/generated.dmodel", documentType: "model" },
  ]);
});

test("確認で取り消すと保存先を選ばず文書もタブも増えない", async () => {
  const state = setupScaffoldAction();
  const result = await ScaffoldAction.run(state.source, {
    ...state.operations,
    confirm: async () => "cancelled",
    selectSavePath: async () => {
      throw new Error("保存ダイアログを開いてはいけない");
    },
  });
  expect(result).toEqual({ status: "cancelled" });
  expect(state.files.size).toBe(1);
  expect(state.openedTabs).toHaveLength(0);
});

test("保存先選択を取り消すと文書もタブも増えない", async () => {
  const state = setupScaffoldAction();
  const result = await ScaffoldAction.run(state.source, {
    ...state.operations,
    selectSavePath: async () => Option.none(),
  });
  expect(result).toEqual({ status: "cancelled" });
  expect(state.files.size).toBe(1);
  expect(state.openedTabs).toHaveLength(0);
});

test("既存モデルへの保存は失敗し内容とタブを維持する", async () => {
  const state = setupScaffoldAction();
  state.files.set("/generated.dmodel", "hand written model");
  const result = await ScaffoldAction.run(state.source, state.operations);
  expect(result).toMatchObject({ status: "writeFailed" });
  expect(state.files.get("/generated.dmodel")).toBe("hand written model");
  expect(state.openedTabs).toHaveLength(0);
});

test("保存が失敗すると失敗を返しモデルタブを開かない", async () => {
  const state = setupScaffoldAction();
  const result = await ScaffoldAction.run(state.source, {
    ...state.operations,
    createFile: async (target) => ({
      type: "err",
      error: { kind: "writeFailed", path: target.path, message: "connection failed" },
    }),
  });
  expect(result).toMatchObject({
    status: "writeFailed",
    error: { message: "connection failed" },
  });
  expect(state.openedTabs).toHaveLength(0);
});

test.each([
  Option.none(),
  Option.some({ kind: "model" as const }),
])("アクティブキャンバスがないと確認も保存もしない (%j)", async (activeDocument) => {
  const state = setupScaffoldAction();
  const result = await ScaffoldAction.run(
    { ...state.source, activeDocument },
    state.operations,
  );
  expect(result).toEqual({ status: "unavailable" });
  expect(state.previews).toEqual([]);
  expect(state.files.size).toBe(1);
  expect(state.openedTabs).toHaveLength(0);
});
