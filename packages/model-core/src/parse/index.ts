import { Constraint } from "../constraint";
import { DataDecl } from "../data-decl";
import { DIAGNOSTIC_SEVERITIES, Diagnostic } from "../diagnostic";
import { Document, type Declaration } from "../document";
import { ErrorDecl } from "../error-decl";
import { NumberRange } from "../number-range";
import { Primitive, type Primitive as PrimitiveType } from "../primitive";
import { RESERVED_WORDS } from "../reserved-word";
import { Result } from "../result";
import { SourceRange, type SourceRange as Range } from "../source-range";
import { TOKEN_KINDS, type Token } from "../token";
import { Tokenizer } from "../tokenizer";
import { TypeExpr } from "../type-expr";
import { TypeModifier, type TypeModifier as Modifier } from "../type-modifier";
import { TypeTerm } from "../type-term";

/** パース結果(AST + トークン列 + 診断)。例外では失敗しない。 */
export type ParseResult = Readonly<{
  document: Document;
  tokens: readonly Token[];
  diagnostics: readonly Diagnostic[];
}>;

type Connector = typeof RESERVED_WORDS.AND | typeof RESERVED_WORDS.OR;

type DeclChunk = Readonly<{
  kind: "data" | "workflow";
  tokens: readonly Token[];
  range: Range;
}>;

type ParsedRange = Readonly<{
  bounds: NumberRange;
  range: Range;
}>;

const emptyRange = (): Range => SourceRange.onLine(1, 1, 1);

const isTrivia = (token: Token): boolean =>
  token.kind === TOKEN_KINDS.comment ||
  token.kind === TOKEN_KINDS.blankLine ||
  token.kind === TOKEN_KINDS.indent;

const isSyncToken = (token: Token): boolean =>
  token.kind === TOKEN_KINDS.reserved &&
  (token.text === RESERVED_WORDS.data ||
    token.text === RESERVED_WORDS.workflow) &&
  token.range.startColumn === 1;

const chunkRange = (tokens: readonly Token[]): Range => {
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  if (first === undefined || last === undefined) {
    return emptyRange();
  }
  return SourceRange.span(first.range, last.range);
};

const documentRange = (tokens: readonly Token[]): Range => {
  if (tokens.length === 0) {
    return emptyRange();
  }
  return chunkRange(tokens);
};

/**
 * トークン列を宣言チャンクに分割する。
 * 非インデントの data / workflow を同期ポイントとする。
 * @param tokens 全文のトークン列。
 * @returns 宣言チャンク列。
 */
const splitDeclarationChunks = (
  tokens: readonly Token[],
): readonly DeclChunk[] => {
  const syncIndexes = tokens.flatMap((token, index) =>
    isSyncToken(token) ? [index] : [],
  );
  return syncIndexes.map((startIndex, order) => {
    const nextSync = syncIndexes[order + 1];
    const endIndex = nextSync === undefined ? tokens.length : nextSync;
    const chunkTokens = tokens.slice(startIndex, endIndex);
    const start = tokens[startIndex];
    return {
      kind: start?.text === RESERVED_WORDS.workflow ? "workflow" : "data",
      tokens: chunkTokens,
      range: chunkRange(chunkTokens),
    };
  });
};

/** チャンク内カーソル。trivia を読み飛ばしながら走査する。 */
class ChunkCursor {
  #index = 0;

  constructor(readonly tokens: readonly Token[]) {}

  /** 残りに意味トークンが無いか。 */
  get atEnd(): boolean {
    this.#skipTrivia();
    return this.#index >= this.tokens.length;
  }

  /** 次の意味トークンを返す(進めない)。 */
  peek(): Token | undefined {
    this.#skipTrivia();
    return this.tokens[this.#index];
  }

  /**
   * 現在位置から n 個先の意味トークンを返す(0 が peek と同じ)。
   * @param offset 先読み個数。
   * @returns 意味トークン。無ければ undefined。
   */
  peekAt(offset: number): Token | undefined {
    this.#skipTrivia();
    let seen = 0;
    for (let index = this.#index; index < this.tokens.length; index += 1) {
      const token = this.tokens[index];
      if (token === undefined || isTrivia(token)) {
        continue;
      }
      if (seen === offset) {
        return token;
      }
      seen += 1;
    }
    return undefined;
  }

  /** 次の意味トークンを消費して返す。 */
  advance(): Token | undefined {
    this.#skipTrivia();
    const token = this.tokens[this.#index];
    if (token !== undefined) {
      this.#index += 1;
    }
    return token;
  }

  #skipTrivia(): void {
    while (this.#index < this.tokens.length) {
      const token = this.tokens[this.#index];
      if (token === undefined || !isTrivia(token)) {
        return;
      }
      this.#index += 1;
    }
  }
}

const errorAt = (message: string, range: Range): Diagnostic =>
  Diagnostic.create(DIAGNOSTIC_SEVERITIES.error, message, range);

const fallbackRange = (cursor: ChunkCursor, chunk: DeclChunk): Range => {
  const token = cursor.peek();
  return token?.range ?? chunk.range;
};

const expectReserved = (
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
  return Result.err(errorAt(message, fallbackRange(cursor, chunk)));
};

const expectEquals = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
): Result<Token, Diagnostic> => {
  const token = cursor.peek();
  if (token !== undefined && token.kind === TOKEN_KINDS.equals) {
    cursor.advance();
    return Result.ok(token);
  }
  return Result.err(errorAt("= が必要です", fallbackRange(cursor, chunk)));
};

const expectIdentifierName = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
): Result<Token, Diagnostic> => {
  const token = cursor.peek();
  if (token !== undefined && token.kind === TOKEN_KINDS.identifier) {
    cursor.advance();
    return Result.ok(token);
  }
  return Result.err(
    errorAt("データ名の識別子が必要です", fallbackRange(cursor, chunk)),
  );
};

const parseTerm = (
  cursor: ChunkCursor,
  chunk: DeclChunk,
): Result<TypeTerm, Diagnostic> => {
  const token = cursor.peek();
  if (token === undefined) {
    return Result.err(errorAt("型参照が必要です", chunk.range));
  }
  if (token.kind !== TOKEN_KINDS.identifier) {
    return Result.err(
      errorAt("型参照の識別子またはプリミティブ型が必要です", token.range),
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
      return Result.err(errorAt("範囲には .. が必要です", first.range));
    }
    cursor.advance();
    const maxToken = cursor.peek();
    if (maxToken !== undefined && maxToken.kind === TOKEN_KINDS.number) {
      cursor.advance();
      const max = Number(maxToken.text);
      const range = SourceRange.span(first.range, maxToken.range);
      if (min > max) {
        return Result.err(errorAt("範囲の下限が上限を超えています", range));
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
        errorAt("範囲には下限または上限が必要です", first.range),
      );
    }
    cursor.advance();
    return Result.ok({
      bounds: NumberRange.maxOnly(Number(maxToken.text)),
      range: SourceRange.span(first.range, maxToken.range),
    });
  }

  return Result.err(
    errorAt("制約の範囲が必要です", fallbackRange(cursor, chunk)),
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
      errorAt(
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
        errorAt(
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
      errorAt(
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
  const constrained = expectReserved(
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
      errorAt(
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
        errorAt(
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
    return Result.err(errorAt("連結には2つ以上の型参照が必要です", range));
  }
  if (connector === RESERVED_WORDS.AND) {
    return Result.ok(TypeExpr.record(terms, range));
  }
  return Result.ok(TypeExpr.choice(terms, range));
};

const parseTypeExpr = (
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
};

const parseDataChunk = (chunk: DeclChunk): Result<DataDecl, Diagnostic> => {
  const cursor = new ChunkCursor(chunk.tokens);
  const dataKeyword = expectReserved(
    cursor,
    RESERVED_WORDS.data,
    chunk,
    "data が必要です",
  );
  if (Result.isErr(dataKeyword)) {
    return dataKeyword;
  }

  const nameToken = expectIdentifierName(cursor, chunk);
  if (Result.isErr(nameToken)) {
    return nameToken;
  }

  const equals = expectEquals(cursor, chunk);
  if (Result.isErr(equals)) {
    return equals;
  }

  const typeExpr = parseTypeExpr(cursor, chunk);
  if (Result.isErr(typeExpr)) {
    return typeExpr;
  }

  if (!cursor.atEnd) {
    const unexpected = cursor.peek();
    return Result.err(
      errorAt(
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

/**
 * data チャンクを宣言またはエラー宣言へ変換する。
 * @param chunk data 宣言チャンク。
 * @returns 宣言と診断。
 */
const materializeDataChunk = (
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
};

/** `.dmodel` テキストを AST・トークン・診断へ解析する。 */
export const Parse = {
  /**
   * ソース全文を解析する。どんな入力でも例外を投げず結果を返す。
   * data 宣言を解析する。workflow は #90 で対応するためチャンクをスキップする。
   * @param source `.dmodel` テキスト。
   * @returns AST + トークン列 + 診断リスト。
   */
  parse: (source: string): ParseResult => {
    const tokens = Tokenizer.tokenize(source);
    const dataChunks = splitDeclarationChunks(tokens).filter(
      (chunk) => chunk.kind === "data",
    );
    // workflow 宣言パーサーは #90
    const materialized = dataChunks.map(materializeDataChunk);
    return {
      document: Document.create(
        materialized.map((item) => item.declaration),
        documentRange(tokens),
      ),
      tokens,
      diagnostics: materialized.flatMap((item) => item.diagnostics),
    };
  },
} as const;
