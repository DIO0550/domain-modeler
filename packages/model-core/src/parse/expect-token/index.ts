import { DIAGNOSTIC_SEVERITIES, Diagnostic } from "../../diagnostic";
import { Result } from "../../result";
import type { SourceRange as Range } from "../../source-range";
import { TOKEN_KINDS, type Token } from "../../token";
import { ChunkCursor, type WithCursor } from "../chunk-cursor";
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
    const token = ChunkCursor.peek(cursor);
    return token?.range ?? chunk.range;
  },

  /**
   * 指定テキストの予約語トークンを消費する。
   * @param cursor チャンクカーソル。
   * @param text 期待する予約語。
   * @param chunk 宣言チャンク。
   * @param message 不一致時のメッセージ。
   * @returns 予約語トークンと消費後カーソル、または診断。
   */
  reserved: (
    cursor: ChunkCursor,
    text: string,
    chunk: DeclChunk,
    message: string,
  ): Result<WithCursor<Token>, Diagnostic> => {
    const token = ChunkCursor.peek(cursor);
    if (
      token !== undefined &&
      token.kind === TOKEN_KINDS.reserved &&
      token.text === text
    ) {
      const advanced = ChunkCursor.advance(cursor);
      return Result.ok({ cursor: advanced.cursor, value: token });
    }
    return Result.err(
      ExpectToken.errorAt(message, ExpectToken.fallbackRange(cursor, chunk)),
    );
  },

  /**
   * `=` トークンを消費する。
   * @param cursor チャンクカーソル。
   * @param chunk 宣言チャンク。
   * @returns equals トークンと消費後カーソル、または診断。
   */
  equals: (
    cursor: ChunkCursor,
    chunk: DeclChunk,
  ): Result<WithCursor<Token>, Diagnostic> => {
    const token = ChunkCursor.peek(cursor);
    if (token !== undefined && token.kind === TOKEN_KINDS.equals) {
      const advanced = ChunkCursor.advance(cursor);
      return Result.ok({ cursor: advanced.cursor, value: token });
    }
    return Result.err(
      ExpectToken.errorAt(
        "= が必要です",
        ExpectToken.fallbackRange(cursor, chunk),
      ),
    );
  },

  /**
   * 宣言名の識別子トークンを消費する。
   * @param cursor チャンクカーソル。
   * @param chunk 宣言チャンク。
   * @param declarationKind 宣言の種類。
   * @returns 識別子トークンと消費後カーソル、または診断。
   */
  declarationName: (
    cursor: ChunkCursor,
    chunk: DeclChunk,
    declarationKind: DeclChunk["kind"],
  ): Result<WithCursor<Token>, Diagnostic> => {
    const token = ChunkCursor.peek(cursor);
    if (token !== undefined && token.kind === TOKEN_KINDS.identifier) {
      const advanced = ChunkCursor.advance(cursor);
      return Result.ok({ cursor: advanced.cursor, value: token });
    }
    return Result.err(
      ExpectToken.errorAt(
        declarationKind === "data"
          ? "データ名の識別子が必要です"
          : "workflow 名の識別子が必要です",
        ExpectToken.fallbackRange(cursor, chunk),
      ),
    );
  },
} as const;
