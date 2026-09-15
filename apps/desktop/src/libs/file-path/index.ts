import { invoke } from "@tauri-apps/api/core";

const ENCODED_PATH_PREFIX = "\0domain-modeler-path-v1:";

/** IPC用の可逆パスから、人に見せる部分だけを返す。通常のパスは変更しない。 */
export const displayFilePath = (path: string): string => {
  if (!path.startsWith(ENCODED_PATH_PREFIX)) {
    return path;
  }
  const separator = path.indexOf("|");
  return separator < 0 ? path : path.slice(separator + 1);
};

/**
 * 2つのパスが同じファイルを表すかを、実行環境のファイルシステム規則で判定する。
 * IPC が利用できない場合は、判定不能として安全側で一致として扱う。
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
    return true;
  }
};
