/** ファイル書き込みに失敗した理由。 */
export type FileWriteError = Readonly<{
  kind: "writeFailed";
  path: string;
  message: string;
}>;

/** ファイル書き込み IPC の結果。 */
export type FileWriteResult =
  | Readonly<{ type: "ok" }>
  | Readonly<{ type: "err"; error: FileWriteError }>;

/**
 * ファイル書き込みの例外を失敗結果へ変換する。
 *
 * @param writeFile 対象パスへ内容を書く操作。
 * @param target 書き込み先パスと内容。
 * @returns 成功または書き込み失敗。
 */
export const writeFileAsResult = async (
  writeFile: (path: string, contents: string) => Promise<FileWriteResult>,
  target: Readonly<{ path: string; contents: string }>,
): Promise<FileWriteResult> => {
  try {
    return await writeFile(target.path, target.contents);
  } catch (caught) {
    return {
      type: "err",
      error: {
        kind: "writeFailed",
        path: target.path,
        message: writeFailureMessage(caught),
      },
    };
  }
};

/**
 * 書き込み例外から失敗メッセージを取り出す。
 *
 * @param caught 捕捉した例外。
 * @returns 表示用の失敗メッセージ。
 */
const writeFailureMessage = (caught: unknown): string => {
  if (caught instanceof Error) {
    return caught.message;
  }
  return String(caught);
};
