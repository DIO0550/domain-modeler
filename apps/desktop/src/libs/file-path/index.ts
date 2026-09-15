import { invoke } from "@tauri-apps/api/core";

/**
 * 2つのパスが同じファイルを表すかを、実行環境のファイルシステム規則で判定する。
 * IPC が利用できない場合も、少なくとも同一文字列のパスは一致として扱う。
 *
 * @param left 比較するパス。
 * @param right 比較するパス。
 * @returns 同じファイルを表す場合は true。
 */
export const sameFilePath = async (
  left: string,
  right: string,
): Promise<boolean> => {
  try {
    return await invoke<boolean>("same_file_path", { left, right });
  } catch {
    return left === right;
  }
};
