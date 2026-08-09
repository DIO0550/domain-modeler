import type { Constraint } from "../constraint";
import type { Primitive } from "../primitive";
import type { SourceRange } from "../source-range";
import type { TypeTerm } from "../type-term";

/**
 * data 宣言の型式。
 * form は model-editor のカード分類(ALIAS/RECORD/CHOICE/VALUE)と 1:1。
 * record/choice の terms はパーサが length >= 2 を保証する。
 */
export type TypeExpr =
  | Readonly<{
      form: "alias";
      term: TypeTerm;
      range: SourceRange;
    }>
  | Readonly<{
      form: "record";
      terms: readonly TypeTerm[];
      range: SourceRange;
    }>
  | Readonly<{
      form: "choice";
      terms: readonly TypeTerm[];
      range: SourceRange;
    }>
  | Readonly<{
      form: "value";
      primitive: Primitive;
      primitiveRange: SourceRange;
      constraint: Constraint;
      range: SourceRange;
    }>;

/** TypeExpr.value を生成するときの引数。 */
export type TypeExprValueParams = Readonly<{
  primitive: Primitive;
  primitiveRange: SourceRange;
  constraint: Constraint;
  range: SourceRange;
}>;

/** 型式を生成・判別する関数群。 */
export const TypeExpr = {
  /**
   * 単一参照の型式を生成する。
   * @param term 参照項。
   * @param range 型式全体のソース範囲。
   * @returns alias 型式。
   */
  alias: (term: TypeTerm, range: SourceRange): TypeExpr => ({
    form: "alias",
    term,
    range,
  }),
  /**
   * AND 連結(直積)の型式を生成する。
   * @param terms 連結する項(パーサ保証: 2つ以上)。
   * @param range 型式全体のソース範囲。
   * @returns record 型式。
   */
  record: (terms: readonly TypeTerm[], range: SourceRange): TypeExpr => ({
    form: "record",
    terms,
    range,
  }),
  /**
   * OR 連結(直和)の型式を生成する。
   * @param terms 連結する項(パーサ保証: 2つ以上)。
   * @param range 型式全体のソース範囲。
   * @returns choice 型式。
   */
  choice: (terms: readonly TypeTerm[], range: SourceRange): TypeExpr => ({
    form: "choice",
    terms,
    range,
  }),
  /**
   * 制約付きプリミティブの型式を生成する。
   * @param params 生成パラメータ。
   * @returns value 型式。
   */
  value: (params: TypeExprValueParams): TypeExpr => ({
    form: "value",
    primitive: params.primitive,
    primitiveRange: params.primitiveRange,
    constraint: params.constraint,
    range: params.range,
  }),
  /**
   * alias 型式か判定する。
   * @param expr 判定する型式。
   * @returns alias の場合は `true`。
   */
  isAlias: (expr: TypeExpr): expr is Extract<TypeExpr, { form: "alias" }> =>
    expr.form === "alias",
  /**
   * record 型式か判定する。
   * @param expr 判定する型式。
   * @returns record の場合は `true`。
   */
  isRecord: (expr: TypeExpr): expr is Extract<TypeExpr, { form: "record" }> =>
    expr.form === "record",
  /**
   * choice 型式か判定する。
   * @param expr 判定する型式。
   * @returns choice の場合は `true`。
   */
  isChoice: (expr: TypeExpr): expr is Extract<TypeExpr, { form: "choice" }> =>
    expr.form === "choice",
  /**
   * value 型式か判定する。
   * @param expr 判定する型式。
   * @returns value の場合は `true`。
   */
  isValue: (expr: TypeExpr): expr is Extract<TypeExpr, { form: "value" }> =>
    expr.form === "value",
} as const;
