import { Document } from "@domain-modeler/canvas-core";
import { Generate } from "@domain-modeler/scaffold";
import { expect, test } from "vitest";
import { TabsState } from "@/appShell/tabs";
import type { FileWriteResult } from "@/libs/file-write";
import { Option } from "@/utils/Option";
import { ScaffoldAction } from "../index";

function setup() {
  let tabs = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/source.dcanvas",
    documentType: "canvas",
  });
  const files = new Map<string, string>([
    ["/source.dcanvas", "original canvas"],
  ]);
  const previews: string[] = [];
  const source = {
    activeDocument: Option.some({
      kind: "canvas" as const,
      document: { ...Document.empty(), title: "注文" },
    }),
    generatedOn: "2026-09-14",
  };
  const createFile = async (target: Readonly<{ path: string; contents: string }>): Promise<FileWriteResult> => {
    if (files.has(target.path)) {
      return {
        type: "err",
        error: {
          kind: "writeFailed",
          path: target.path,
          message: "already exists",
        },
      };
    }
    files.set(target.path, target.contents);
    return { type: "ok" };
  };
  const operations = {
    createFile,
    confirm: async (text: string): Promise<"confirmed" | "cancelled"> => {
      previews.push(text);
      return "confirmed";
    },
    selectSavePath: async () => Option.some("/generated.dmodel"),
    openTab: (path: string, documentType: "model") => {
      tabs = TabsState.reducer(tabs, { type: "openTab", path, documentType });
    },
  };
  return { source, operations, files, previews, tabs: () => tabs };
}

test("確認した全文を新規保存し元キャンバスを残してモデルタブを前面に開く", async () => {
  const state = setup();
  const result = await ScaffoldAction.run(state.source, state.operations);
  const text = Generate.toDmodelText(
    state.source.activeDocument.value.document,
    state.source.generatedOn,
  );
  expect(result).toEqual({ status: "created", path: "/generated.dmodel" });
  expect(state.previews).toEqual([text]);
  expect(state.files.get("/generated.dmodel")).toBe(text);
  expect(state.files.get("/source.dcanvas")).toBe("original canvas");
  expect(state.tabs()).toMatchObject({
    activePath: "/generated.dmodel",
    tabs: [
      { path: "/source.dcanvas" },
      { path: "/generated.dmodel", documentType: "model" },
    ],
  });
});

test("確認で取り消すと保存先を選ばず文書もタブも増えない", async () => {
  const state = setup();
  const result = await ScaffoldAction.run(state.source, {
    ...state.operations,
    confirm: async () => "cancelled",
    selectSavePath: async () => {
      throw new Error("保存ダイアログを開いてはいけない");
    },
  });
  expect(result).toEqual({ status: "cancelled" });
  expect(state.files.size).toBe(1);
  expect(state.tabs().tabs).toHaveLength(1);
});

test("保存先選択を取り消すと文書もタブも増えない", async () => {
  const state = setup();
  const result = await ScaffoldAction.run(state.source, {
    ...state.operations,
    selectSavePath: async () => Option.none(),
  });
  expect(result).toEqual({ status: "cancelled" });
  expect(state.files.size).toBe(1);
  expect(state.tabs().tabs).toHaveLength(1);
});

test("既存モデルへの保存は失敗し内容とタブを維持する", async () => {
  const state = setup();
  state.files.set("/generated.dmodel", "hand written model");
  const result = await ScaffoldAction.run(state.source, state.operations);
  expect(result).toMatchObject({ status: "writeFailed" });
  expect(state.files.get("/generated.dmodel")).toBe("hand written model");
  expect(state.tabs().tabs).toHaveLength(1);
});

test("保存が失敗すると失敗を返しモデルタブを開かない", async () => {
  const state = setup();
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
  expect(state.tabs().tabs).toHaveLength(1);
});

test.each([
  Option.none(),
  Option.some({ kind: "model" as const }),
])("アクティブキャンバスがないと確認も保存もしない (%j)", async (activeDocument) => {
  const state = setup();
  const result = await ScaffoldAction.run(
    { ...state.source, activeDocument },
    state.operations,
  );
  expect(result).toEqual({ status: "unavailable" });
  expect(state.previews).toEqual([]);
  expect(state.files.size).toBe(1);
  expect(state.tabs().tabs).toHaveLength(1);
});
