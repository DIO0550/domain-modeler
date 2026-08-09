import type { ValueOf } from "../types/value-of";

/** 後置修飾の列挙値(model-format.md §5)。 */
export const TYPE_MODIFIERS = {
  list: "list",
  option: "option",
} as const;

/** 型参照の後置修飾。 */
export type TypeModifier = ValueOf<typeof TYPE_MODIFIERS>;

/** 後置修飾を判定する関数群。 */
export const TypeModifier = {
  /**
   * 値が後置修飾か判定する。
   * @param value 判定する値。
   * @returns 後置修飾の場合は `true`。
   */
  is: (value: string): value is TypeModifier => value in TYPE_MODIFIERS,
} as const;
