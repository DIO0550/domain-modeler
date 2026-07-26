import type { CanvasError } from "./error";

/** 成功値を表す。 */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/** 失敗値を表す。 */
export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

/** 成功値または失敗値を表す型。 */
export type Result<T, E = CanvasError> = Ok<T> | Err<E>;

/** `Result` を生成し、状態を判定する関数群。 */
export const Result = {
  /** 成功した `Result` を生成する。 */
  ok: <T>(value: T): Ok<T> => ({ ok: true, value }),
  /** 失敗した `Result` を生成する。 */
  err: <E>(error: E): Err<E> => ({ ok: false, error }),
  /** `Result` が成功か判定する。 */
  isOk: <T, E>(result: Result<T, E>): result is Ok<T> => result.ok,
  /** `Result` が失敗か判定する。 */
  isErr: <T, E>(result: Result<T, E>): result is Err<E> => !result.ok,
};
