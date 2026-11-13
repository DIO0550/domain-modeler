/** 成功値を表す。 */
export type Ok<T> = Readonly<{
  ok: true;
  value: T;
}>;

/** 失敗値を表す。 */
export type Err<E> = Readonly<{
  ok: false;
  error: E;
}>;

/** 成功または失敗を表す型。 */
export type Result<T, E> = Ok<T> | Err<E>;

/** `Result` を生成し、状態を判定する関数群。 */
export const Result = {
  /**
   * 成功した `Result` を生成する。
   * @param value 成功時の値。
   * @returns 成功した `Result`。
   */
  ok: <T>(value: T): Ok<T> => ({ ok: true, value }),

  /**
   * 失敗した `Result` を生成する。
   * @param error 失敗時のエラー。
   * @returns 失敗した `Result`。
   */
  err: <E>(error: E): Err<E> => ({ ok: false, error }),

  /**
   * `Result` が成功か判定する。
   * @param result 判定する `Result`。
   * @returns 成功している場合は `true`。
   */
  isOk: <T, E>(result: Result<T, E>): result is Ok<T> => result.ok,

  /**
   * `Result` が失敗か判定する。
   * @param result 判定する `Result`。
   * @returns 失敗している場合は `true`。
   */
  isErr: <T, E>(result: Result<T, E>): result is Err<E> => !result.ok,

  /**
   * 成功値を取り出す。失敗の場合は例外を投げる(テスト専用)。
   * @param result 取り出し対象の `Result`。
   * @returns 成功時の値。
   * @throws 失敗の `Result` を渡した場合。
   */
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (result.ok) {
      return result.value;
    }

    throw new Error(`Tried to unwrap Err: ${JSON.stringify(result.error)}`);
  },
} as const;
