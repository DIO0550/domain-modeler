import type { CanvasError } from "./error";

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export type Result<T, E = CanvasError> = Ok<T> | Err<E>;

export const Result = {
  ok: <T>(value: T): Ok<T> => ({ ok: true, value }),
  err: <E>(error: E): Err<E> => ({ ok: false, error }),
  isOk: <T, E>(result: Result<T, E>): result is Ok<T> => result.ok,
  isErr: <T, E>(result: Result<T, E>): result is Err<E> => !result.ok,
};
