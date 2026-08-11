import type { Diagnostic } from "../../diagnostic";
import type { Declaration } from "../../document";
import { ErrorDecl } from "../../error-decl";
import { RESERVED_WORDS } from "../../reserved-word";
import { Result } from "../../result";
import { SourceRange } from "../../source-range";
import { TOKEN_KINDS, type Token } from "../../token";
import type { TypeTerm } from "../../type-term";
import {
  WorkflowDecl,
  WorkflowErrorClause,
  WorkflowSection,
} from "../../workflow-decl";
import { ChunkCursor, type WithCursor } from "../chunk-cursor";
import type { DeclChunk } from "../decl-chunk";
import { ExpectToken } from "../expect-token";
import type { MaterializedDecl } from "../materialized-decl";
import { TypeTermParse } from "../type-term";

type SectionKind = "input" | "output" | "error";

type ParsedTerms = Readonly<{
  terms: readonly TypeTerm[];
  endRange: TypeTerm["range"];
}>;

type TermsParseState = Readonly<{
  cursor: ChunkCursor;
  parsed: ParsedTerms;
}>;

type ParsedSection = Readonly<{
  section: WorkflowSection;
}>;

type ParsedErrorClause = Readonly<{
  clause: WorkflowErrorClause;
  endRange: WorkflowSection["range"];
}>;

/**
 * 節で許可される連結子を返す。
 * @param kind workflow 節の種類。
 * @returns input では AND、それ以外では OR。
 */
const connectorFor = (
  kind: SectionKind,
): typeof RESERVED_WORDS.AND | typeof RESERVED_WORDS.OR =>
  kind === "input" ? RESERVED_WORDS.AND : RESERVED_WORDS.OR;

/**
 * トークンが AND または OR かを判定する。
 * @param token 判定するトークン。
 * @returns 連結子の場合は true。
 */
const isConnector = (token: Token): boolean =>
  token.kind === TOKEN_KINDS.reserved &&
  (token.text === RESERVED_WORDS.AND || token.text === RESERVED_WORDS.OR);

/**
 * workflow 節の型参照項を収集する。
 * @param chunk workflow 宣言チャンク。
 * @param kind workflow 節の種類。
 * @param state カーソルと収集済みの型参照項。
 * @returns 型参照項と消費後カーソル、または診断。
 */
const collectTerms = (
  chunk: DeclChunk,
  kind: SectionKind,
  state: TermsParseState,
): Result<WithCursor<ParsedTerms>, Diagnostic> => {
  const token = ChunkCursor.peek(state.cursor);
  if (token === undefined || !isConnector(token)) {
    return Result.ok({ cursor: state.cursor, value: state.parsed });
  }
  const connector = connectorFor(kind);
  if (token.text !== connector) {
    return Result.err(
      ExpectToken.errorAt(
        `${kind}: では ${token.text} を使用できません`,
        token.range,
      ),
    );
  }
  const afterConnector = ChunkCursor.advance(state.cursor);
  const term = TypeTermParse.parse(afterConnector.cursor, chunk);
  if (Result.isErr(term)) {
    return term;
  }
  return collectTerms(chunk, kind, {
    cursor: term.value.cursor,
    parsed: {
      terms: [...state.parsed.terms, term.value.value],
      endRange: term.value.value.range,
    },
  });
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
  const firstTerm = TypeTermParse.parse(marker.value.cursor, chunk);
  if (Result.isErr(firstTerm)) {
    return firstTerm;
  }
  const parsedTerms = collectTerms(chunk, kind, {
    cursor: firstTerm.value.cursor,
    parsed: {
      terms: [firstTerm.value.value],
      endRange: firstTerm.value.value.range,
    },
  });
  if (Result.isErr(parsedTerms)) {
    return parsedTerms;
  }
  return Result.ok({
    cursor: parsedTerms.value.cursor,
    value: {
      section: WorkflowSection.create(
        parsedTerms.value.value.terms,
        SourceRange.span(
          marker.value.value.range,
          parsedTerms.value.value.endRange,
        ),
      ),
    },
  });
};

/**
 * 任意の error 節を解析する。
 * @param cursor output 節の直後にあるカーソル。
 * @param chunk workflow 宣言チャンク。
 * @param outputRange output 節のソース範囲。
 * @returns error 節の有無と消費後カーソル、または診断。
 */
const parseErrorClause = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
  outputRange: WorkflowSection["range"],
): Result<WithCursor<ParsedErrorClause>, Diagnostic> => {
  const next = ChunkCursor.peek(cursor);
  if (next === undefined || next.text !== RESERVED_WORDS["error:"]) {
    return Result.ok({
      cursor,
      value: {
        clause: WorkflowErrorClause.absent(),
        endRange: outputRange,
      },
    });
  }
  const error = parseSection(cursor, chunk, "error");
  if (Result.isErr(error)) {
    return error;
  }
  return Result.ok({
    cursor: error.value.cursor,
    value: {
      clause: WorkflowErrorClause.present(
        error.value.value.section.terms,
        error.value.value.section.range,
      ),
      endRange: error.value.value.section.range,
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
  if (Result.isErr(keyword)) {
    return keyword;
  }
  const name = ExpectToken.declarationName(
    keyword.value.cursor,
    chunk,
    "workflow",
  );
  if (Result.isErr(name)) {
    return name;
  }
  const equals = ExpectToken.equals(name.value.cursor, chunk);
  if (Result.isErr(equals)) {
    return equals;
  }
  const input = parseSection(equals.value.cursor, chunk, "input");
  if (Result.isErr(input)) {
    return input;
  }
  const output = parseSection(input.value.cursor, chunk, "output");
  if (Result.isErr(output)) {
    return output;
  }
  const error = parseErrorClause(
    output.value.cursor,
    chunk,
    output.value.value.section.range,
  );
  if (Result.isErr(error)) {
    return error;
  }
  if (!ChunkCursor.atEnd(error.value.cursor)) {
    return Result.err(
      ExpectToken.errorAt(
        "workflow 宣言の後に余分なトークンがあります",
        ExpectToken.fallbackRange(error.value.cursor, chunk),
      ),
    );
  }
  return Result.ok(
    WorkflowDecl.create({
      name: name.value.value.text,
      nameRange: name.value.value.range,
      input: input.value.value.section,
      output: output.value.value.section,
      error: error.value.value.clause,
      range: SourceRange.span(
        keyword.value.value.range,
        error.value.value.endRange,
      ),
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
