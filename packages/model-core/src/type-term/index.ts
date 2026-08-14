import { SourceRange, type SourceRange as Range } from "../source-range";
import type { TypeModifier } from "../type-modifier";

/** 型参照の1項(識別子またはプリミティブ + 後置修飾)。 */
export type TypeTerm = Readonly<{
  name: string;
  isPrimitive: boolean;
  modifiers: readonly TypeModifier[];
  range: Range;
}>;

/** TypeTerm を生成するときの引数。 */
export type TypeTermCreateParams = Readonly<{
  name: string;
  isPrimitive: boolean;
  modifiers: readonly TypeModifier[];
  range: Range;
}>;

/** 型参照項を生成する関数群。 */
export const TypeTerm = {
  /**
   * 名前・プリミティブ判定・修飾・位置から型参照項を生成する。
   * @param params 生成パラメータ。
   * @returns 型参照項。
   */
  create: (params: TypeTermCreateParams): TypeTerm => ({
    name: params.name,
    isPrimitive: params.isPrimitive,
    modifiers: params.modifiers,
    range: params.range,
  }),
  /**
   * 型名識別子だけのソース範囲を返す(後置修飾を含まない)。
   * @param term 型参照項。
   * @returns 型名のソース範囲。
   */
  nameRange: (term: TypeTerm): Range =>
    SourceRange.onLine(
      term.range.startLine,
      term.range.startColumn,
      term.range.startColumn + term.name.length,
    ),
  /**
   * 参照解決の対象になる型参照項か判定する。
   * プリミティブ型は対象外(model-core.md §7)。
   * @param term 型参照項。
   * @returns 名前付き参照の場合は `true`。
   */
  isResolvable: (term: TypeTerm): boolean => !term.isPrimitive,
} as const;
