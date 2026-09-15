import { invoke } from "@tauri-apps/api/core";

type CreateResult =
  | Readonly<{ type: "ok" }>
  | Readonly<{
      type: "err";
      error: Readonly<{ kind: "writeFailed"; path: string; message: string }>;
    }>;

/**
 * 新規 .dmodel 作成専用の IPC。既存パスの置換はバックエンドで拒否する。
 * @param target 保存先と確認済みの生成全文。
 * @returns 作成成功または例外を含む書き込み失敗。
 */
export async function createDmodelFile(
  target: Readonly<{ path: string; contents: string }>,
): Promise<CreateResult> {
  try {
    return await invoke<CreateResult>("create_dmodel_file", target);
  } catch (caught) {
    return {
      type: "err",
      error: {
        kind: "writeFailed",
        path: target.path,
        message: caught instanceof Error ? caught.message : String(caught),
      },
    };
  }
}
