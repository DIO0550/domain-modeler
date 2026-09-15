import { invoke } from "@tauri-apps/api/core";

/** 保存先選択の結果。IPCの失敗とユーザーによるキャンセルを区別する。 */
export type SavePathSelection =
  | Readonly<{ status: "selected"; path: string }>
  | Readonly<{ status: "cancelled" }>
  | Readonly<{ status: "dialogFailed"; message: string }>;

/**
 * 文書種別に対応するネイティブ保存ダイアログを開く。
 * @param kind 作成する文書の種別。
 * @returns 選択したパス、キャンセル、またはダイアログの失敗。
 */
export const selectSavePath = async (
  kind: "canvas" | "model",
): Promise<SavePathSelection> => {
  try {
    const path = await invoke<string | null>("save_file_dialog", { kind });
    if (path === null) {
      return { status: "cancelled" };
    }
    return { status: "selected", path };
  } catch (caught) {
    return { status: "dialogFailed", message: String(caught) };
  }
};
