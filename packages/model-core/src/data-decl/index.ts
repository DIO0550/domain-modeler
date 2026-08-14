import type { SourceRange } from "../source-range";
import { TypeExpr } from "../type-expr";
import type { TypeTerm } from "../type-term";
import type { ValueOf } from "../types/value-of";

/** 構造化プレビューの data カード種別(model-editor.md §4.1)。 */
export const DATA_CARD_KINDS = {
  ALIAS: "ALIAS",
  RECORD: "RECORD",
  CHOICE: "CHOICE",
  VALUE: "VALUE",
} as const;

/** data カード種別。 */
export type DataCardKind = ValueOf<typeof DATA_CARD_KINDS>;

/** data 宣言。 */
export type DataDecl = Readonly<{
  kind: "data";
  name: string;
  nameRange: SourceRange;
  typeExpr: TypeExpr;
  range: SourceRange;
}>;

/** DataDecl を生成するときの引数。 */
export type DataDeclCreateParams = Readonly<{
  name: string;
  nameRange: SourceRange;
  typeExpr: TypeExpr;
  range: SourceRange;
}>;

/** data 宣言を生成・分類する関数群。 */
export const DataDecl = {
  /**
   * 名前・型式・位置から data 宣言を生成する。
   * @param params 生成パラメータ。
   * @returns data 宣言。
   */
  create: (params: DataDeclCreateParams): DataDecl => ({
    kind: "data",
    name: params.name,
    nameRange: params.nameRange,
    typeExpr: params.typeExpr,
    range: params.range,
  }),
  /**
   * 型式の form からプレビューカード種別を導出する。
   * @param decl data 宣言。
   * @returns ALIAS / RECORD / CHOICE / VALUE。
   */
  cardKind: (decl: DataDecl): DataCardKind => {
    switch (decl.typeExpr.form) {
      case "alias":
        return DATA_CARD_KINDS.ALIAS;
      case "record":
        return DATA_CARD_KINDS.RECORD;
      case "choice":
        return DATA_CARD_KINDS.CHOICE;
      case "value":
        return DATA_CARD_KINDS.VALUE;
    }
  },
  /**
   * data 宣言の型式に含まれる型参照項を列挙する。
   * @param decl data 宣言。
   * @returns 型参照項の列。
   */
  referencedTerms: (decl: DataDecl): readonly TypeTerm[] =>
    TypeExpr.referencedTerms(decl.typeExpr),
} as const;
