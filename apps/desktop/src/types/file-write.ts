/** ファイル書き込みに失敗した理由。 */
export type FileWriteError = Readonly<{
  kind: "writeFailed";
  path: string;
  message: string;
}>;

/**
 * ファイル書き込みの結果。
 * 例外は `libs/file-write` の境界で失敗結果へ変換するため、この型を返す操作は throw しない。
 */
export type FileWriteResult =
  | Readonly<{ type: "ok" }>
  | Readonly<{ type: "err"; error: FileWriteError }>;
