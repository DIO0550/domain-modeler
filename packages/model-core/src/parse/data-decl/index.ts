import { DataDecl } from "../../data-decl";
import type { Diagnostic } from "../../diagnostic";
import type { Declaration } from "../../document";
import { ErrorDecl } from "../../error-decl";
import { RESERVED_WORDS } from "../../reserved-word";
import { Result } from "../../result";
import { SourceRange } from "../../source-range";
import { ChunkCursor } from "../chunk-cursor";
import type { DeclChunk } from "../decl-chunk";
import { ExpectToken } from "../expect-token";
import { TypeExprParse } from "../type-expr";

/**
 * data チャンクを DataDecl へ解析する。
 * @param chunk data 宣言チャンク。
 * @returns data 宣言、または診断。
 */
const parseDataChunk = (chunk: DeclChunk): Result<DataDecl, Diagnostic> => {
  const cursor = new ChunkCursor(chunk.tokens);
  const dataKeyword = ExpectToken.reserved(
    cursor,
    RESERVED_WORDS.data,
    chunk,
    "data が必要です",
  );
  if (Result.isErr(dataKeyword)) {
    return dataKeyword;
  }

  const nameToken = ExpectToken.identifierName(cursor, chunk);
  if (Result.isErr(nameToken)) {
    return nameToken;
  }

  const equals = ExpectToken.equals(cursor, chunk);
  if (Result.isErr(equals)) {
    return equals;
  }

  const typeExpr = TypeExprParse.parse(cursor, chunk);
  if (Result.isErr(typeExpr)) {
    return typeExpr;
  }

  if (!cursor.atEnd) {
    const unexpected = cursor.peek();
    return Result.err(
      ExpectToken.errorAt(
        "型式の後に余分なトークンがあります",
        unexpected?.range ?? chunk.range,
      ),
    );
  }

  return Result.ok(
    DataDecl.create({
      name: nameToken.value.text,
      nameRange: nameToken.value.range,
      typeExpr: typeExpr.value,
      range: SourceRange.span(dataKeyword.value.range, typeExpr.value.range),
    }),
  );
};

/** data 宣言チャンクを AST 宣言へ変換する関数群。 */
export const DataDeclParse = {
  /**
   * data チャンクを宣言またはエラー宣言へ変換する。
   * @param chunk data 宣言チャンク。
   * @returns 宣言と診断。
   */
  materialize: (
    chunk: DeclChunk,
  ): Readonly<{
    declaration: Declaration;
    diagnostics: readonly Diagnostic[];
  }> => {
    const parsed = parseDataChunk(chunk);
    if (Result.isOk(parsed)) {
      return { declaration: parsed.value, diagnostics: [] };
    }
    return {
      declaration: ErrorDecl.create(chunk.range),
      diagnostics: [parsed.error],
    };
  },
} as const;
