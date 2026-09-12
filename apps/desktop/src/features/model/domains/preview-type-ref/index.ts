import {
  TypeTerm,
  type TypeTerm as TypeTermValue,
  type ValueOf,
} from "@domain-modeler/model-core";

/** プレビュー上の型参照の解決状態。 */
export const PREVIEW_TYPE_RESOLUTIONS = {
  primitive: "primitive",
  defined: "defined",
  undefined: "undefined",
} as const;

/** プレビュー上の型参照の解決状態。 */
export type PreviewTypeResolution = ValueOf<typeof PREVIEW_TYPE_RESOLUTIONS>;

/** プレビュー上の型参照。プリミティブ・定義済み・未定義は同時に成り立たない。 */
export type PreviewTypeRef =
  | Readonly<{
      resolution: typeof PREVIEW_TYPE_RESOLUTIONS.primitive;
      term: TypeTermValue;
    }>
  | Readonly<{
      resolution: typeof PREVIEW_TYPE_RESOLUTIONS.defined;
      term: TypeTermValue;
    }>
  | Readonly<{
      resolution: typeof PREVIEW_TYPE_RESOLUTIONS.undefined;
      term: TypeTermValue;
    }>;

/** プレビュー用の型参照を生成する関数群。 */
export const PreviewTypeRef = {
  /**
   * 型参照項と未定義名からプレビュー用の型参照を生成する。
   * プリミティブ型は未定義バッジの対象にしない。
   * @param term 型参照項。
   * @param undefinedTypeNames 未定義の型名。
   * @returns プレビュー用の型参照。
   */
  create(
    term: TypeTermValue,
    undefinedTypeNames: ReadonlySet<string>,
  ): PreviewTypeRef {
    if (!TypeTerm.isResolvable(term)) {
      return { resolution: PREVIEW_TYPE_RESOLUTIONS.primitive, term };
    }
    if (undefinedTypeNames.has(term.name)) {
      return { resolution: PREVIEW_TYPE_RESOLUTIONS.undefined, term };
    }
    return { resolution: PREVIEW_TYPE_RESOLUTIONS.defined, term };
  },
  /**
   * 型参照項の列をプレビュー用の型参照にする。
   * @param terms 型参照項の列。
   * @param undefinedTypeNames 未定義の型名。
   * @returns プレビュー用の型参照の列。
   */
  createMany(
    terms: readonly TypeTermValue[],
    undefinedTypeNames: ReadonlySet<string>,
  ): readonly PreviewTypeRef[] {
    return terms.map((term) => PreviewTypeRef.create(term, undefinedTypeNames));
  },
  /**
   * 未定義バッジの対象か判定する。
   * @param typeRef プレビュー用の型参照。
   * @returns 未定義の名前付き参照なら `true`。
   */
  isUndefined: (typeRef: PreviewTypeRef): boolean =>
    typeRef.resolution === PREVIEW_TYPE_RESOLUTIONS.undefined,
  /**
   * プリミティブ型の参照か判定する。
   * @param typeRef プレビュー用の型参照。
   * @returns プリミティブなら `true`。
   */
  isPrimitive: (typeRef: PreviewTypeRef): boolean =>
    typeRef.resolution === PREVIEW_TYPE_RESOLUTIONS.primitive,
} as const;
