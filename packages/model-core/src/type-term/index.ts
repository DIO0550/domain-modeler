import type { SourceRange } from "../source-range";
import type { TypeModifier } from "../type-modifier";

/** 型参照の1項(識別子またはプリミティブ + 後置修飾)。 */
export type TypeTerm = Readonly<{
  name: string;
  isPrimitive: boolean;
  modifiers: readonly TypeModifier[];
  range: SourceRange;
}>;

/** TypeTerm を生成するときの引数。 */
export type TypeTermCreateParams = Readonly<{
  name: string;
  isPrimitive: boolean;
  modifiers: readonly TypeModifier[];
  range: SourceRange;
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
} as const;
