import { Document, History } from "@domain-modeler/canvas-core";
import { expect, test } from "vitest";
import {
  ExternalFileEvents,
  type ExternalFileEventError,
  type ExternalFileEventOperations,
} from "./externalFileEvents";
import { TabsState, type TabsAction } from "./tabs";

type Effect =
  | Readonly<{ type: "tabAction"; action: TabsAction }>
  | Readonly<{ type: "notification"; error: ExternalFileEventError }>;

/**
 * 外部ファイルイベントの副作用を記録する操作を返す。
 *
 * @param contents 読み込むファイル内容。
 * @param effects 記録先。
 * @returns テスト用の外部操作。
 */
const operationsRecording = (
  contents: string,
  effects: Effect[],
): ExternalFileEventOperations => ({
  readFile: async () => ({ type: "ok", value: contents }),
  hashContents: (value) => `hash:${value}`,
  dispatchTabs: (action) => {
    effects.push({ type: "tabAction", action });
  },
  notifyError: (error) => {
    effects.push({ type: "notification", error });
  },
});

test("直近に保存した内容とハッシュが一致する変更イベントは取り込まない", async () => {
  const effects: Effect[] = [];
  const history = History.create(Document.empty("編集中"));
  const contents = '{"saved":true}';

  const result = await ExternalFileEvents.handleChanged(
    {
      path: "/documents/order.dcanvas",
      activation: "active",
      lastSavedHash: `hash:${contents}`,
      document: { documentType: "canvas", history },
    },
    operationsRecording(contents, effects),
  );

  expect(result).toEqual({ status: "ignored", document: { documentType: "canvas", history } });
  expect(effects).toEqual([
    {
      type: "tabAction",
      action: { type: "clearFileMissing", path: "/documents/order.dcanvas" },
    },
  ]);
});

test("アクティブなキャンバスへ外部変更を取り込んでも成功通知を出さない", async () => {
  const effects: Effect[] = [];
  const contents = JSON.stringify({
    version: "1.0",
    title: "外部編集後",
    viewport: { x: 0, y: 0, zoom: 1 },
    stickies: [],
    connections: [],
  });

  const result = await ExternalFileEvents.handleChanged(
    {
      path: "/documents/order.dcanvas",
      activation: "active",
      lastSavedHash: "hash:保存前",
      document: {
        documentType: "canvas",
        history: History.create(Document.empty("編集前")),
      },
    },
    operationsRecording(contents, effects),
  );

  expect(result).toMatchObject({
    status: "applied",
    document: {
      documentType: "canvas",
      history: { current: { title: "外部編集後" } },
    },
    fileHash: `hash:${contents}`,
  });
  expect(effects).toEqual([
    {
      type: "tabAction",
      action: { type: "clearFileMissing", path: "/documents/order.dcanvas" },
    },
  ]);
});

test("背景のモデルへ外部変更を取り込むとタブへ変更マークを付ける", async () => {
  const effects: Effect[] = [];
  const path = "/documents/order.dmodel";
  const tabs = TabsState.reducer(
    TabsState.reducer(TabsState.create(), {
      type: "openTab",
      path,
      documentType: "model",
    }),
    {
      type: "openTab",
      path: "/documents/active.dcanvas",
      documentType: "canvas",
    },
  );

  const result = await ExternalFileEvents.handleChanged(
    {
      path,
      activation: "background",
      lastSavedHash: "hash:編集前",
      document: { documentType: "model", contents: "編集前" },
    },
    operationsRecording("外部編集後", effects),
  );
  const updatedTabs = effects
    .filter((effect) => effect.type === "tabAction")
    .reduce(
      (state, effect) => TabsState.reducer(state, effect.action),
      tabs,
    );

  expect(result).toEqual({
    status: "applied",
    document: { documentType: "model", contents: "外部編集後" },
    fileHash: "hash:外部編集後",
  });
  expect(updatedTabs.tabs[0]?.backgroundChangeState).toEqual({
    status: "changed",
  });
  expect(effects).toEqual([
    {
      type: "tabAction",
      action: { type: "clearFileMissing", path },
    },
    {
      type: "tabAction",
      action: { type: "markBackgroundChanged", path },
    },
  ]);
});

test("削除イベントは文書を維持したままタブを欠損状態にする", () => {
  const effects: Effect[] = [];
  const document = { documentType: "model", contents: "編集中" } as const;

  const result = ExternalFileEvents.handleDeleted(
    { path: "/documents/order.dmodel", document },
    operationsRecording("unused", effects),
  );

  expect(result).toEqual({ status: "missing", document });
  expect(effects).toEqual([
    {
      type: "tabAction",
      action: {
        type: "markFileMissing",
        path: "/documents/order.dmodel",
      },
    },
  ]);
});
