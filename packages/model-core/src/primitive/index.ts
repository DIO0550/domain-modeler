import type { ValueOf } from "../types/value-of";

/** プリミティブ型の列挙値(model-format.md §3)。 */
export const PRIMITIVES = {
  string: "string",
  int: "int",
  decimal: "decimal",
  bool: "bool",
  date: "date",
  datetime: "datetime",
} as const;

/** プリミティブ型。 */
export type Primitive = ValueOf<typeof PRIMITIVES>;

/** プリミティブ型を判定する関数群。 */
export const Primitive = {
  /**
   * 値がプリミティブ型か判定する。
   * @param value 判定する値。
   * @returns プリミティブ型の場合は `true`。
   */
  is: (value: string): value is Primitive => Object.hasOwn(PRIMITIVES, value),
} as const;
