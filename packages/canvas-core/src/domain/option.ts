/** 値が存在することを表す。 */
export interface Some<T> {
  readonly some: true;
  readonly value: T;
}

/** 値が存在しないことを表す。 */
export interface None {
  readonly some: false;
}

/** 値が存在する場合と存在しない場合を表す型。 */
export type Option<T> = Some<T> | None;

/** `Option` を生成し、状態を判定する関数群。 */
export const Option = {
  /**
   * 値を持つ `Option` を生成する。
   * @param value 保持する値。
   * @returns 値を持つ `Option`。
   */
  some: <T>(value: T): Some<T> => ({ some: true, value }),
  /**
   * 値を持たない `Option` を生成する。
   * @returns 値を持たない `Option`。
   */
  none: (): None => ({ some: false }),
  /**
   * `Option` が値を持つか判定する。
   * @param option 判定する `Option`。
   * @returns 値を持つ場合は `true`。
   */
  isSome: <T>(option: Option<T>): option is Some<T> => option.some,
  /**
   * `Option` が値を持たないか判定する。
   * @param option 判定する `Option`。
   * @returns 値を持たない場合は `true`。
   */
  isNone: <T>(option: Option<T>): option is None => !option.some,
};
