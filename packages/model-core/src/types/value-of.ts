/**
 * オブジェクト型の値のユニオンを取り出す。
 * @example
 * const KINDS = { a: "a", b: "b" } as const;
 * type Kind = ValueOf<typeof KINDS>; // "a" | "b"
 */
export type ValueOf<T> = T[keyof T];
