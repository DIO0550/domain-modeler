import {
  DATA_CARD_KINDS,
  DataDecl,
  NumberRange,
  type NumberRange as NumberRangeValue,
  type Primitive,
} from "@domain-modeler/model-core";
import { PreviewTypeRef } from "../preview-type-ref";

export { PreviewTypeRef };

/** ALIAS カードのプレビュー。 */
export type AliasDataCardPreview = Readonly<{
  kind: typeof DATA_CARD_KINDS.ALIAS;
  name: string;
  term: PreviewTypeRef;
}>;

/** RECORD カードのプレビュー。 */
export type RecordDataCardPreview = Readonly<{
  kind: typeof DATA_CARD_KINDS.RECORD;
  name: string;
  fields: readonly PreviewTypeRef[];
}>;

/** CHOICE カードのプレビュー。 */
export type ChoiceDataCardPreview = Readonly<{
  kind: typeof DATA_CARD_KINDS.CHOICE;
  name: string;
  cases: readonly PreviewTypeRef[];
}>;

/** VALUE カードのプレビュー。 */
export type ValueDataCardPreview = Readonly<{
  kind: typeof DATA_CARD_KINDS.VALUE;
  name: string;
  caption: string;
}>;

/** data 宣言の構造化プレビュー(model-editor.md §4.1)。 */
export type DataCardPreview =
  | AliasDataCardPreview
  | RecordDataCardPreview
  | ChoiceDataCardPreview
  | ValueDataCardPreview;

/** data 宣言からプレビューカードを組み立てる関数群。 */
export const DataCardPreview = {
  /**
   * data 宣言と未定義名からプレビューカードを組み立てる。
   * @param decl data 宣言。
   * @param undefinedTypeNames 未定義の型名。
   * @returns ALIAS / RECORD / CHOICE / VALUE のプレビュー。
   */
  create(
    decl: DataDecl,
    undefinedTypeNames: ReadonlySet<string>,
  ): DataCardPreview {
    switch (decl.typeExpr.form) {
      case "alias":
        return {
          kind: DATA_CARD_KINDS.ALIAS,
          name: decl.name,
          term: PreviewTypeRef.create(decl.typeExpr.term, undefinedTypeNames),
        };
      case "record":
        return {
          kind: DATA_CARD_KINDS.RECORD,
          name: decl.name,
          fields: PreviewTypeRef.createMany(
            decl.typeExpr.terms,
            undefinedTypeNames,
          ),
        };
      case "choice":
        return {
          kind: DATA_CARD_KINDS.CHOICE,
          name: decl.name,
          cases: PreviewTypeRef.createMany(
            decl.typeExpr.terms,
            undefinedTypeNames,
          ),
        };
      case "value":
        return {
          kind: DATA_CARD_KINDS.VALUE,
          name: decl.name,
          caption: valueCaption(
            decl.typeExpr.primitive,
            decl.typeExpr.constraint.bounds,
          ),
        };
    }
  },
} as const;

/**
 * VALUE カードに出すプリミティブ型と制約の見出しを組み立てる。
 * @param primitive プリミティブ型。
 * @param bounds 制約の数値範囲。
 * @returns `int 1..100` 形式の見出し。
 */
const valueCaption = (
  primitive: Primitive,
  bounds: NumberRangeValue,
): string => `${primitive} ${NumberRange.toSource(bounds)}`;
