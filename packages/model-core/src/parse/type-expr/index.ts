import { Constraint } from "../../constraint";
import type { Diagnostic } from "../../diagnostic";
import { NumberRange } from "../../number-range";
import { Primitive, type Primitive as PrimitiveType } from "../../primitive";
import { RESERVED_WORDS } from "../../reserved-word";
import { Result } from "../../result";
import { SourceRange, type SourceRange as Range } from "../../source-range";
import { TOKEN_KINDS, type Token } from "../../token";
import { TypeExpr } from "../../type-expr";
import type { TypeTerm } from "../../type-term";
import { ChunkCursor, type WithCursor } from "../chunk-cursor";
import type { DeclChunk } from "../decl-chunk";
import { ExpectToken } from "../expect-token";
import { TypeTermParse } from "../type-term";

type Connector = typeof RESERVED_WORDS.AND | typeof RESERVED_WORDS.OR;

type ParsedRange = Readonly<{
  bounds: NumberRange;
  range: Range;
}>;

const parseNumberRange = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
): Result<WithCursor<ParsedRange>, Diagnostic> => {
  const first = ChunkCursor.peek(cursor);
  if (first !== undefined && first.kind === TOKEN_KINDS.number) {
    const afterMin = ChunkCursor.advance(cursor);
    const min = Number(first.text);
    const dots = ChunkCursor.peek(afterMin.cursor);
    if (dots === undefined || dots.kind !== TOKEN_KINDS.rangeDots) {
      return Result.err(
        ExpectToken.errorAt("範囲には .. が必要です", first.range),
      );
    }
    const afterDots = ChunkCursor.advance(afterMin.cursor);
    const maxToken = ChunkCursor.peek(afterDots.cursor);
    if (maxToken !== undefined && maxToken.kind === TOKEN_KINDS.number) {
      const afterMax = ChunkCursor.advance(afterDots.cursor);
      const max = Number(maxToken.text);
      const range = SourceRange.span(first.range, maxToken.range);
      if (min > max) {
        return Result.err(
          ExpectToken.errorAt("範囲の下限が上限を超えています", range),
        );
      }
      return Result.ok({
        cursor: afterMax.cursor,
        value: { bounds: NumberRange.both(min, max), range },
      });
    }
    return Result.ok({
      cursor: afterDots.cursor,
      value: {
        bounds: NumberRange.minOnly(min),
        range: SourceRange.span(first.range, dots.range),
      },
    });
  }

  if (first !== undefined && first.kind === TOKEN_KINDS.rangeDots) {
    const afterDots = ChunkCursor.advance(cursor);
    const maxToken = ChunkCursor.peek(afterDots.cursor);
    if (maxToken === undefined || maxToken.kind !== TOKEN_KINDS.number) {
      return Result.err(
        ExpectToken.errorAt(
          "範囲には下限または上限が必要です",
          first.range,
        ),
      );
    }
    const afterMax = ChunkCursor.advance(afterDots.cursor);
    return Result.ok({
      cursor: afterMax.cursor,
      value: {
        bounds: NumberRange.maxOnly(Number(maxToken.text)),
        range: SourceRange.span(first.range, maxToken.range),
      },
    });
  }

  return Result.err(
    ExpectToken.errorAt(
      "制約の範囲が必要です",
      ExpectToken.fallbackRange(cursor, chunk),
    ),
  );
};

const parseConstraintBody = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
  primitive: PrimitiveType,
  constrainedToken: Token,
): Result<WithCursor<Constraint>, Diagnostic> => {
  if (
    primitive === "bool" ||
    primitive === "date" ||
    primitive === "datetime"
  ) {
    return Result.err(
      ExpectToken.errorAt(
        `${primitive} 型に制約を付けることはできません`,
        constrainedToken.range,
      ),
    );
  }

  const lengthToken = ChunkCursor.peek(cursor);
  const hasLength =
    lengthToken !== undefined &&
    lengthToken.kind === TOKEN_KINDS.reserved &&
    lengthToken.text === RESERVED_WORDS.length;

  if (hasLength) {
    const afterLength = ChunkCursor.advance(cursor);
    if (primitive !== "string") {
      return Result.err(
        ExpectToken.errorAt(
          `${primitive} 型の制約に length は使えません`,
          lengthToken.range,
        ),
      );
    }
    const parsed = parseNumberRange(afterLength.cursor, chunk);
    if (Result.isErr(parsed)) {
      return parsed;
    }
    return Result.ok({
      cursor: parsed.value.cursor,
      value: Constraint.length(
        parsed.value.value.bounds,
        SourceRange.span(constrainedToken.range, parsed.value.value.range),
      ),
    });
  }

  if (primitive === "string") {
    return Result.err(
      ExpectToken.errorAt(
        "string 型の制約には length が必要です",
        constrainedToken.range,
      ),
    );
  }

  const parsed = parseNumberRange(cursor, chunk);
  if (Result.isErr(parsed)) {
    return parsed;
  }
  return Result.ok({
    cursor: parsed.value.cursor,
    value: Constraint.numeric(
      parsed.value.value.bounds,
      SourceRange.span(constrainedToken.range, parsed.value.value.range),
    ),
  });
};

const parseConstrainedTypeExpr = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
  primitiveToken: Token,
): Result<WithCursor<TypeExpr>, Diagnostic> => {
  const afterPrimitive = ChunkCursor.advance(cursor);
  const constrained = ExpectToken.reserved(
    afterPrimitive.cursor,
    RESERVED_WORDS.constrained,
    chunk,
    "constrained が必要です",
  );
  if (Result.isErr(constrained)) {
    return constrained;
  }
  if (!Primitive.is(primitiveToken.text)) {
    return Result.err(
      ExpectToken.errorAt(
        "制約付き型式の左辺はプリミティブ型である必要があります",
        primitiveToken.range,
      ),
    );
  }
  const constraint = parseConstraintBody(
    constrained.value.cursor,
    chunk,
    primitiveToken.text,
    constrained.value.value,
  );
  if (Result.isErr(constraint)) {
    return constraint;
  }
  return Result.ok({
    cursor: constraint.value.cursor,
    value: TypeExpr.value({
      primitive: primitiveToken.text,
      primitiveRange: primitiveToken.range,
      constraint: constraint.value.value,
      range: SourceRange.span(
        primitiveToken.range,
        constraint.value.value.range,
      ),
    }),
  });
};

const isConnector = (token: Token): token is Token & { text: Connector } =>
  token.kind === TOKEN_KINDS.reserved &&
  (token.text === RESERVED_WORDS.AND || token.text === RESERVED_WORDS.OR);

type JoinedTerms = Readonly<{
  terms: readonly TypeTerm[];
  connector: Connector | undefined;
}>;

const collectJoinedTerms = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
  terms: readonly TypeTerm[],
  connector: Connector | undefined,
): Result<WithCursor<JoinedTerms>, Diagnostic> => {
  if (ChunkCursor.atEnd(cursor)) {
    return Result.ok({ cursor, value: { terms, connector } });
  }
  const token = ChunkCursor.peek(cursor);
  if (token === undefined || !isConnector(token)) {
    return Result.ok({ cursor, value: { terms, connector } });
  }
  if (connector !== undefined && connector !== token.text) {
    return Result.err(
      ExpectToken.errorAt(
        "AND と OR を同じ宣言内で混在させることはできません",
        token.range,
      ),
    );
  }
  const afterConnector = ChunkCursor.advance(cursor);
  const nextTerm = TypeTermParse.parse(afterConnector.cursor, chunk);
  if (Result.isErr(nextTerm)) {
    return nextTerm;
  }
  return collectJoinedTerms(
    nextTerm.value.cursor,
    chunk,
    [...terms, nextTerm.value.value],
    connector ?? token.text,
  );
};

const parseJoinedTypeExpr = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
): Result<WithCursor<TypeExpr>, Diagnostic> => {
  const firstTerm = TypeTermParse.parse(cursor, chunk);
  if (Result.isErr(firstTerm)) {
    return firstTerm;
  }

  const joined = collectJoinedTerms(
    firstTerm.value.cursor,
    chunk,
    [firstTerm.value.value],
    undefined,
  );
  if (Result.isErr(joined)) {
    return joined;
  }

  const { terms, connector } = joined.value.value;
  const lastTerm = terms[terms.length - 1] ?? firstTerm.value.value;
  const range = SourceRange.span(firstTerm.value.value.range, lastTerm.range);

  if (connector === undefined) {
    return Result.ok({
      cursor: joined.value.cursor,
      value: TypeExpr.alias(firstTerm.value.value, range),
    });
  }
  if (terms.length < 2) {
    return Result.err(
      ExpectToken.errorAt("連結には2つ以上の型参照が必要です", range),
    );
  }
  if (connector === RESERVED_WORDS.AND) {
    return Result.ok({
      cursor: joined.value.cursor,
      value: TypeExpr.record(terms, range),
    });
  }
  return Result.ok({
    cursor: joined.value.cursor,
    value: TypeExpr.choice(terms, range),
  });
};

/** 型式をトークン列から解析する関数群。 */
export const TypeExprParse = {
  /**
   * カーソル位置から型式を解析する。
   * @param cursor チャンクカーソル。
   * @param chunk 宣言チャンク。
   * @returns 型式と消費後カーソル、または診断。
   */
  parse: (
    cursor: ChunkCursor,
    chunk: DeclChunk,
  ): Result<WithCursor<TypeExpr>, Diagnostic> => {
    const head = ChunkCursor.peekAt(cursor, 0);
    const next = ChunkCursor.peekAt(cursor, 1);
    if (
      head !== undefined &&
      head.kind === TOKEN_KINDS.identifier &&
      Primitive.is(head.text) &&
      next !== undefined &&
      next.kind === TOKEN_KINDS.reserved &&
      next.text === RESERVED_WORDS.constrained
    ) {
      return parseConstrainedTypeExpr(cursor, chunk, head);
    }
    return parseJoinedTypeExpr(cursor, chunk);
  },
} as const;
