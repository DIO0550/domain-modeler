/**
 * オブジェクト型の値のユニオンを取り出す。
 * @example
 * const ANCHORS = { top: "top", right: "right" } as const;
 * type Anchor = ValueOf<typeof ANCHORS>; // "top" | "right"
 */
export type ValueOf<T> = T[keyof T];
