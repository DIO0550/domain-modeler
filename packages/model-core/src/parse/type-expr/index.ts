import { Constraint } from "../../constraint";
import type { Diagnostic } from "../../diagnostic";
import { NumberRange } from "../../number-range";
import { Primitive, type Primitive as PrimitiveType } from "../../primitive";
import { RESERVED_WORDS } from "../../reserved-word";
import { Result } from "../../result";
import { SourceRange, type SourceRange as Range } from "../../source-range";
import { TOKEN_KINDS, type Token } from "../../token";
import { TypeExpr } from "../../type-expr";
import { TypeModifier, type TypeModifier as Modifier } from "../../type-modifier";
import { TypeTerm } from "../../type-term";
import type { ChunkCursor } from "../chunk-cursor";
import type { DeclChunk } from "../decl-chunk";
import { ExpectToken } from "../expect-token";

type Connector = typeof RESERVED_WORDS.AND | typeof RESERVED_WORDS.OR;

type ParsedRange = Readonly<{
  bounds: NumberRange;
  range: Range;
}>;

const parseTerm = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
): Result<TypeTerm, Diagnostic> => {
  const token = cursor.peek();
  if (token === undefined) {
    return Result.err(ExpectToken.errorAt("型参照が必要です", chunk.range));
  }
  if (token.kind !== TOKEN_KINDS.identifier) {
    return Result.err(
      ExpectToken.errorAt(
        "型参照の識別子またはプリミティブ型が必要です",
        token.range,
      ),
    );
  }

  cursor.advance();
  const startRange = token.range;
  let endRange = token.range;
  const modifiers: Modifier[] = [];
  while (true) {
    const modifierToken = cursor.peek();
    if (
      modifierToken === undefined ||
      modifierToken.kind !== TOKEN_KINDS.reserved ||
      !TypeModifier.is(modifierToken.text)
    ) {
      break;
    }
    modifiers.push(modifierToken.text);
    endRange = modifierToken.range;
    cursor.advance();
  }

  return Result.ok(
    TypeTerm.create({
      name: token.text,
      isPrimitive: Primitive.is(token.text),
      modifiers,
      range: SourceRange.span(startRange, endRange),
    }),
  );
};

const parseNumberRange = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
): Result<ParsedRange, Diagnostic> => {
  const first = cursor.peek();
  if (first !== undefined && first.kind === TOKEN_KINDS.number) {
    cursor.advance();
    const min = Number(first.text);
    const dots = cursor.peek();
    if (dots === undefined || dots.kind !== TOKEN_KINDS.rangeDots) {
      return Result.err(
        ExpectToken.errorAt("範囲には .. が必要です", first.range),
      );
    }
    cursor.advance();
    const maxToken = cursor.peek();
    if (maxToken !== undefined && maxToken.kind === TOKEN_KINDS.number) {
      cursor.advance();
      const max = Number(maxToken.text);
      const range = SourceRange.span(first.range, maxToken.range);
      if (min > max) {
        return Result.err(
          ExpectToken.errorAt("範囲の下限が上限を超えています", range),
        );
      }
      return Result.ok({ bounds: NumberRange.both(min, max), range });
    }
    return Result.ok({
      bounds: NumberRange.minOnly(min),
      range: SourceRange.span(first.range, dots.range),
    });
  }

  if (first !== undefined && first.kind === TOKEN_KINDS.rangeDots) {
    cursor.advance();
    const maxToken = cursor.peek();
    if (maxToken === undefined || maxToken.kind !== TOKEN_KINDS.number) {
      return Result.err(
        ExpectToken.errorAt(
          "範囲には下限または上限が必要です",
          first.range,
        ),
      );
    }
    cursor.advance();
    return Result.ok({
      bounds: NumberRange.maxOnly(Number(maxToken.text)),
      range: SourceRange.span(first.range, maxToken.range),
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
): Result<Constraint, Diagnostic> => {
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

  const lengthToken = cursor.peek();
  const hasLength =
    lengthToken !== undefined &&
    lengthToken.kind === TOKEN_KINDS.reserved &&
    lengthToken.text === RESERVED_WORDS.length;

  if (hasLength) {
    cursor.advance();
    if (primitive !== "string") {
      return Result.err(
        ExpectToken.errorAt(
          `${primitive} 型の制約に length は使えません`,
          lengthToken.range,
        ),
      );
    }
    const parsed = parseNumberRange(cursor, chunk);
    if (Result.isErr(parsed)) {
      return parsed;
    }
    return Result.ok(
      Constraint.length(
        parsed.value.bounds,
        SourceRange.span(constrainedToken.range, parsed.value.range),
      ),
    );
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
  return Result.ok(
    Constraint.numeric(
      parsed.value.bounds,
      SourceRange.span(constrainedToken.range, parsed.value.range),
    ),
  );
};

const parseConstrainedTypeExpr = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
  primitiveToken: Token,
): Result<TypeExpr, Diagnostic> => {
  cursor.advance();
  const constrained = ExpectToken.reserved(
    cursor,
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
    cursor,
    chunk,
    primitiveToken.text,
    constrained.value,
  );
  if (Result.isErr(constraint)) {
    return constraint;
  }
  return Result.ok(
    TypeExpr.value({
      primitive: primitiveToken.text,
      primitiveRange: primitiveToken.range,
      constraint: constraint.value,
      range: SourceRange.span(primitiveToken.range, constraint.value.range),
    }),
  );
};

const isConnector = (token: Token): token is Token & { text: Connector } =>
  token.kind === TOKEN_KINDS.reserved &&
  (token.text === RESERVED_WORDS.AND || token.text === RESERVED_WORDS.OR);

const parseJoinedTypeExpr = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
): Result<TypeExpr, Diagnostic> => {
  const firstTerm = parseTerm(cursor, chunk);
  if (Result.isErr(firstTerm)) {
    return firstTerm;
  }

  const terms: TypeTerm[] = [firstTerm.value];
  let connector: Connector | undefined;

  while (!cursor.atEnd) {
    const token = cursor.peek();
    if (token === undefined || !isConnector(token)) {
      break;
    }
    if (connector === undefined) {
      connector = token.text;
    } else if (connector !== token.text) {
      return Result.err(
        ExpectToken.errorAt(
          "AND と OR を同じ宣言内で混在させることはできません",
          token.range,
        ),
      );
    }
    cursor.advance();
    const nextTerm = parseTerm(cursor, chunk);
    if (Result.isErr(nextTerm)) {
      return nextTerm;
    }
    terms.push(nextTerm.value);
  }

  const lastTerm = terms[terms.length - 1] ?? firstTerm.value;
  const range = SourceRange.span(firstTerm.value.range, lastTerm.range);

  if (connector === undefined) {
    return Result.ok(TypeExpr.alias(firstTerm.value, range));
  }
  if (terms.length < 2) {
    return Result.err(
      ExpectToken.errorAt("連結には2つ以上の型参照が必要です", range),
    );
  }
  if (connector === RESERVED_WORDS.AND) {
    return Result.ok(TypeExpr.record(terms, range));
  }
  return Result.ok(TypeExpr.choice(terms, range));
};

/** 型式をトークン列から解析する関数群。 */
export const TypeExprParse = {
  /**
   * カーソル位置から型式を解析する。
   * @param cursor チャンクカーソル。
   * @param chunk 宣言チャンク。
   * @returns 型式、または診断。
   */
  parse: (
    cursor: ChunkCursor,
    chunk: DeclChunk,
  ): Result<TypeExpr, Diagnostic> => {
    const head = cursor.peekAt(0);
    const next = cursor.peekAt(1);
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
