import type { NumberRange } from "../number-range";
import type { SourceRange } from "../source-range";

/**
 * 制約構文(model-format.md §6)。
 * `numeric` は int/decimal、`length` は string 向け。
 */
export type Constraint =
  | Readonly<{
      kind: "numeric";
      bounds: NumberRange;
      range: SourceRange;
    }>
  | Readonly<{
      kind: "length";
      bounds: NumberRange;
      range: SourceRange;
    }>;

/** 制約を生成する関数群。 */
export const Constraint = {
  /**
   * 数値範囲制約を生成する。
   * @param bounds 数値範囲。
   * @param range 制約構文のソース範囲。
   * @returns 数値制約。
   */
  numeric: (bounds: NumberRange, range: SourceRange): Constraint => ({
    kind: "numeric",
    bounds,
    range,
  }),
  /**
   * 文字列長制約を生成する。
   * @param bounds 長さの範囲。
   * @param range 制約構文のソース範囲。
   * @returns 長さ制約。
   */
  length: (bounds: NumberRange, range: SourceRange): Constraint => ({
    kind: "length",
    bounds,
    range,
  }),
} as const;
