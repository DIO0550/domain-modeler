import { Document, History } from "@domain-modeler/canvas-core";
import { expect, test } from "vitest";
import type { FileReadResult } from "./fileActions";
import {
  ExternalFileEvents,
  type ExternalFileEventError,
  type ExternalFileEventOperations,
} from "./externalFileEvents";
import type { TabsAction } from "./tabs";

type Effect =
  | Readonly<{ type: "tabAction"; action: TabsAction }>
  | Readonly<{ type: "notification"; error: ExternalFileEventError }>;

/**
 * 指定した読み込み結果を返し、副作用を記録する操作を返す。
 *
 * @param readResult ファイル読み込み結果。
 * @param effects 記録先。
 * @returns テスト用の外部操作。
 */
const operationsRecording = (
  readResult: FileReadResult,
  effects: Effect[],
): ExternalFileEventOperations => ({
  readFile: async () => readResult,
  hashContents: (contents) => `hash:${contents}`,
  dispatchTabs: (action) => {
    effects.push({ type: "tabAction", action });
  },
  notifyError: (error) => {
    effects.push({ type: "notification", error });
  },
});

test("外部変更の読み込みに失敗すると現在の文書を維持して通知する", async () => {
  const effects: Effect[] = [];
  const document = { documentType: "model", contents: "編集中" } as const;
  const readError = {
    kind: "readFailed",
    path: "/documents/order.dmodel",
    message: "permission denied",
  } as const;

  const result = await ExternalFileEvents.handleChanged(
    {
      path: "/documents/order.dmodel",
      activation: "active",
      lastSavedHash: "hash:編集中",
      document,
    },
    operationsRecording({ type: "err", error: readError }, effects),
  );

  const error = { kind: "readFailed", error: readError } as const;
  expect(result).toEqual({ status: "rejected", document, error });
  expect(effects).toEqual([{ type: "notification", error }]);
});

test("不正なキャンバスの外部変更は現在の履歴を維持して通知する", async () => {
  const effects: Effect[] = [];
  const history = History.create(Document.empty("編集中"));
  const document = { documentType: "canvas", history } as const;

  const result = await ExternalFileEvents.handleChanged(
    {
      path: "/documents/order.dcanvas",
      activation: "background",
      lastSavedHash: "hash:保存済み",
      document,
    },
    operationsRecording(
      { type: "ok", value: "{ invalid json" },
      effects,
    ),
  );

  expect(result).toMatchObject({
    status: "rejected",
    document,
    error: {
      kind: "invalidCanvas",
      path: "/documents/order.dcanvas",
      error: { code: "INVALID_JSON" },
    },
  });
  expect(effects).toHaveLength(2);
  expect(effects[0]).toEqual({
    type: "tabAction",
    action: {
      type: "clearFileMissing",
      path: "/documents/order.dcanvas",
    },
  });
  expect(effects[1]).toMatchObject({
    type: "notification",
    error: {
      kind: "invalidCanvas",
      path: "/documents/order.dcanvas",
      error: { code: "INVALID_JSON" },
    },
  });
});

test("背景タブへの取り込み失敗では変更マークを付けない", async () => {
  const effects: Effect[] = [];

  await ExternalFileEvents.handleChanged(
    {
      path: "/documents/order.dcanvas",
      activation: "background",
      lastSavedHash: "hash:保存済み",
      document: {
        documentType: "canvas",
        history: History.create(Document.empty("編集中")),
      },
    },
    operationsRecording(
      { type: "ok", value: "{ invalid json" },
      effects,
    ),
  );

  expect(effects).not.toContainEqual({
    type: "tabAction",
    action: {
      type: "markBackgroundChanged",
      path: "/documents/order.dcanvas",
    },
  });
});
