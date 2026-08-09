import type { SourceRange } from "../source-range";

/**
 * 構文が壊れて解釈できなかった宣言。
 * メッセージは Diagnostic 側に置き、ここには位置だけを残す。
 */
export type ErrorDecl = Readonly<{
  kind: "error";
  range: SourceRange;
}>;

/** エラー宣言を生成する関数群。 */
export const ErrorDecl = {
  /**
   * 位置だけを持つエラー宣言を生成する。
   * @param range 壊れた宣言が占めるソース範囲。
   * @returns エラー宣言。
   */
  create: (range: SourceRange): ErrorDecl => ({ kind: "error", range }),
} as const;
