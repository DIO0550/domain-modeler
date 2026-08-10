import { DIAGNOSTIC_SEVERITIES, Diagnostic } from "../../diagnostic";
import { Result } from "../../result";
import type { SourceRange as Range } from "../../source-range";
import { TOKEN_KINDS, type Token } from "../../token";
import type { ChunkCursor } from "../chunk-cursor";
import type { DeclChunk } from "../decl-chunk";

/** トークン期待と診断生成の関数群。 */
export const ExpectToken = {
  /**
   * エラー診断を生成する。
   * @param message 人が読めるメッセージ(日本語)。
   * @param range 対象範囲。
   * @returns エラー診断。
   */
  errorAt: (message: string, range: Range): Diagnostic =>
    Diagnostic.create(DIAGNOSTIC_SEVERITIES.error, message, range),

  /**
   * カーソル位置またはチャンク全体のフォールバック範囲。
   * @param cursor チャンクカーソル。
   * @param chunk 宣言チャンク。
   * @returns ソース範囲。
   */
  fallbackRange: (cursor: ChunkCursor, chunk: DeclChunk): Range => {
    const token = cursor.peek();
    return token?.range ?? chunk.range;
  },

  /**
   * 指定テキストの予約語トークンを消費する。
   * @param cursor チャンクカーソル。
   * @param text 期待する予約語。
   * @param chunk 宣言チャンク。
   * @param message 不一致時のメッセージ。
   * @returns 予約語トークン、または診断。
   */
  reserved: (
    cursor: ChunkCursor,
    text: string,
    chunk: DeclChunk,
    message: string,
  ): Result<Token, Diagnostic> => {
    const token = cursor.peek();
    if (
      token !== undefined &&
      token.kind === TOKEN_KINDS.reserved &&
      token.text === text
    ) {
      cursor.advance();
      return Result.ok(token);
    }
    return Result.err(
      ExpectToken.errorAt(message, ExpectToken.fallbackRange(cursor, chunk)),
    );
  },

  /**
   * `=` トークンを消費する。
   * @param cursor チャンクカーソル。
   * @param chunk 宣言チャンク。
   * @returns equals トークン、または診断。
   */
  equals: (
    cursor: ChunkCursor,
    chunk: DeclChunk,
  ): Result<Token, Diagnostic> => {
    const token = cursor.peek();
    if (token !== undefined && token.kind === TOKEN_KINDS.equals) {
      cursor.advance();
      return Result.ok(token);
    }
    return Result.err(
      ExpectToken.errorAt(
        "= が必要です",
        ExpectToken.fallbackRange(cursor, chunk),
      ),
    );
  },

  /**
   * データ名の識別子トークンを消費する。
   * @param cursor チャンクカーソル。
   * @param chunk 宣言チャンク。
   * @returns 識別子トークン、または診断。
   */
  identifierName: (
    cursor: ChunkCursor,
    chunk: DeclChunk,
  ): Result<Token, Diagnostic> => {
    const token = cursor.peek();
    if (token !== undefined && token.kind === TOKEN_KINDS.identifier) {
      cursor.advance();
      return Result.ok(token);
    }
    return Result.err(
      ExpectToken.errorAt(
        "データ名の識別子が必要です",
        ExpectToken.fallbackRange(cursor, chunk),
      ),
    );
  },
} as const;
