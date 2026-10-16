import { clearMocks } from "@tauri-apps/api/mocks";
import { afterEach, expect, test } from "vitest";
import { listenCloseRequested } from "../index";
import { setupAppWindow, setupPendingSave } from "./app-window.test-support";

afterEach(clearMocks);

test("終了前の保存が完了するまで待ち、成功後に現在のウィンドウを一度だけ閉じる", async () => {
  const backend = setupAppWindow();
  const saving = setupPendingSave();
  await listenCloseRequested(() => saving.promise);

  const closing = backend.requestClose();
  await Promise.resolve();

  expect(backend.destroyedWindows).toEqual([]);

  saving.complete(true);
  await closing;

  expect(backend.destroyedWindows).toEqual(["main"]);
});

test("終了前の保存に失敗した場合は標準の終了処理も中止する", async () => {
  const backend = setupAppWindow();
  const saving = setupPendingSave();
  await listenCloseRequested(() => saving.promise);

  const closing = backend.requestClose();
  saving.complete(false);
  await closing;

  expect(backend.destroyedWindows).toEqual([]);
});

test("保存失敗で終了を中止した後も次の終了要求で保存を再試行できる", async () => {
  const backend = setupAppWindow();
  let saved = false;
  await listenCloseRequested(async () => saved);
  await backend.requestClose();

  expect(backend.destroyedWindows).toEqual([]);

  saved = true;
  await backend.requestClose();

  expect(backend.destroyedWindows).toEqual(["main"]);
});

test("購読解除後の終了要求では保存もウィンドウの破棄も行わない", async () => {
  const backend = setupAppWindow();
  let saved = false;
  const unlisten = await listenCloseRequested(async () => {
    saved = true;

    return true;
  });

  unlisten();
  await backend.requestClose();

  expect(saved).toBe(false);
  expect(backend.destroyedWindows).toEqual([]);
});
