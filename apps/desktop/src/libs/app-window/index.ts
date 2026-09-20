import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * アプリウィンドウが利用できる(Tauri 上で動作している)かを返す。
 *
 * @returns Tauri ランタイム上なら true。
 */
export const isAppWindowAvailable = (): boolean => isTauri();

/**
 * ウィンドウの終了要求を横取りし、終了してよいと答えたときだけウィンドウを破棄する。
 *
 * @param canClose 終了前の保存を完了させ、終了してよいかを返す操作。
 * @returns 購読を解除する関数。
 */
export const listenCloseRequested = (
  canClose: () => Promise<boolean>,
): Promise<() => void> => {
  const appWindow = getCurrentWindow();
  return appWindow.onCloseRequested(async (event) => {
    event.preventDefault();
    if (await canClose()) {
      await appWindow.destroy();
    }
  });
};
