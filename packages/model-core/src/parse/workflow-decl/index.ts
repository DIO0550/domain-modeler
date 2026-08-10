import type { Diagnostic } from "../../diagnostic";
import type { Declaration } from "../../document";
import { ErrorDecl } from "../../error-decl";
import { RESERVED_WORDS } from "../../reserved-word";
import { Result } from "../../result";
import { SourceRange } from "../../source-range";
import type { TypeExpr } from "../../type-expr";
import type { TypeTerm } from "../../type-term";
import {
  WorkflowDecl,
  WorkflowErrorClause,
  WorkflowSection,
} from "../../workflow-decl";
import { ChunkCursor, type WithCursor } from "../chunk-cursor";
import type { MaterializedDecl } from "../data-decl";
import type { DeclChunk } from "../decl-chunk";
import { ExpectToken } from "../expect-token";
import { TypeExprParse } from "../type-expr";

type SectionKind = "input" | "output" | "error";

type ParsedSection = Readonly<{
  section: WorkflowSection;
}>;

/**
 * 型式から workflow 節の型参照項を取得する。
 * @param typeExpr 解析済みの型式。
 * @param kind 対象の workflow 節。
 * @returns 許可された連結なら型参照項、違反なら診断。
 */
const termsForSection = (
  typeExpr: TypeExpr,
  kind: SectionKind,
): Result<readonly TypeTerm[], Diagnostic> => {
  if (typeExpr.form === "value") {
    return Result.err(
      ExpectToken.errorAt(
        `${kind}: には型参照が必要です`,
        typeExpr.range,
      ),
    );
  }
  if (typeExpr.form === "record" && kind !== "input") {
    return Result.err(
      ExpectToken.errorAt(`${kind}: では AND を使用できません`, typeExpr.range),
    );
  }
  if (typeExpr.form === "choice" && kind === "input") {
    return Result.err(
      ExpectToken.errorAt("input: では OR を使用できません", typeExpr.range),
    );
  }
  if (typeExpr.form === "alias") {
    return Result.ok([typeExpr.term]);
  }
  return Result.ok(typeExpr.terms);
};

/**
 * workflow の1節を解析する。
 * @param cursor 節の開始位置にあるカーソル。
 * @param chunk workflow 宣言チャンク。
 * @param kind 解析する節の種類。
 * @returns 節と消費後カーソル、または診断。
 */
const parseSection = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
  kind: SectionKind,
): Result<WithCursor<ParsedSection>, Diagnostic> => {
  const markerText = `${kind}:`;
  const marker = ExpectToken.reserved(
    cursor,
    markerText,
    chunk,
    `${markerText} が必要です`,
  );
  if (Result.isErr(marker)) {
    return marker;
  }
  const typeExpr = TypeExprParse.parse(marker.value.cursor, chunk);
  if (Result.isErr(typeExpr)) {
    return typeExpr;
  }
  const terms = termsForSection(typeExpr.value.value, kind);
  if (Result.isErr(terms)) {
    return terms;
  }
  return Result.ok({
    cursor: typeExpr.value.cursor,
    value: {
      section: WorkflowSection.create(
        terms.value,
        SourceRange.span(marker.value.value.range, typeExpr.value.value.range),
      ),
    },
  });
};

/**
 * workflow チャンクを宣言へ解析する。
 * @param chunk workflow 宣言チャンク。
 * @returns workflow 宣言、または診断。
 */
const parseWorkflowChunk = (
  chunk: DeclChunk,
): Result<WorkflowDecl, Diagnostic> => {
  const cursor = ChunkCursor.create(chunk.tokens);
  const keyword = ExpectToken.reserved(
    cursor,
    RESERVED_WORDS.workflow,
    chunk,
    "workflow が必要です",
  );
  if (Result.isErr(keyword)) return keyword;

  const name = ExpectToken.workflowName(keyword.value.cursor, chunk);
  if (Result.isErr(name)) return name;

  const equals = ExpectToken.equals(name.value.cursor, chunk);
  if (Result.isErr(equals)) return equals;

  const input = parseSection(equals.value.cursor, chunk, "input");
  if (Result.isErr(input)) return input;

  const output = parseSection(input.value.cursor, chunk, "output");
  if (Result.isErr(output)) return output;

  const next = ChunkCursor.peek(output.value.cursor);
  const hasError = next?.text === RESERVED_WORDS["error:"];
  const error = hasError
    ? parseSection(output.value.cursor, chunk, "error")
    : undefined;
  if (error !== undefined && Result.isErr(error)) return error;

  const endCursor = error?.value.cursor ?? output.value.cursor;
  if (!ChunkCursor.atEnd(endCursor)) {
    return Result.err(
      ExpectToken.errorAt(
        "workflow 宣言の後に余分なトークンがあります",
        ExpectToken.fallbackRange(endCursor, chunk),
      ),
    );
  }
  const endRange =
    error?.value.value.section.range ?? output.value.value.section.range;
  return Result.ok(
    WorkflowDecl.create({
      name: name.value.value.text,
      nameRange: name.value.value.range,
      input: input.value.value.section,
      output: output.value.value.section,
      error:
        error === undefined
          ? WorkflowErrorClause.absent()
          : WorkflowErrorClause.present(
              error.value.value.section.terms,
              error.value.value.section.range,
            ),
      range: SourceRange.span(keyword.value.value.range, endRange),
    }),
  );
};

/** workflow 宣言チャンクを AST 宣言へ変換する関数群。 */
export const WorkflowDeclParse = {
  /**
   * workflow チャンクを宣言またはエラー宣言へ変換する。
   * @param chunk workflow 宣言チャンク。
   * @returns 宣言と診断。
   */
  materialize: (chunk: DeclChunk): MaterializedDecl => {
    const parsed = parseWorkflowChunk(chunk);
    if (Result.isOk(parsed)) {
      return { declaration: parsed.value, diagnostics: [] };
    }
    const declaration: Declaration = ErrorDecl.create(chunk.range);
    return { declaration, diagnostics: [parsed.error] };
  },
} as const;
