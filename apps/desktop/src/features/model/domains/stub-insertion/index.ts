import {
  Result,
  Stub,
  type Result as ResultType,
} from "@domain-modeler/model-core";
import { CaretPosition } from "../caret-position";
import type { TextEdit } from "../text-edit";

/** 文書末尾へ data スタブを追記する1回分の編集と、追記行のキャレット。 */
export type StubInsertion = Readonly<{
  edit: TextEdit;
  caret: CaretPosition;
}>;

type StubInsertionParams = Readonly<{
  source: string;
  name: string;
}>;

/**
 * 文書末尾が既に改行か判定する。
 *
 * @param source 文書全文。
 * @returns LF または CR で終わっていれば `true`。
 */
const endsWithLineBreak = (source: string): boolean =>
  source.endsWith("\n") || source.endsWith("\r");

/** 未定義参照から data スタブを文書末尾へ追記する関数群。 */
export const StubInsertion = {
  /**
   * 識別子名の data スタブを文書末尾へ追記する編集を作る。
   * 追記直後にジャンプする位置はスタブ行の先頭。
   *
   * @param params 現在の全文とスタブにする型名。
   * @returns 追記編集とジャンプ先。名前が識別子でない場合は失敗。
   */
  atDocumentEnd(
    params: StubInsertionParams,
  ): ResultType<StubInsertion, "invalid_identifier"> {
    const stub = Stub.generate(params.name);
    if (Result.isErr(stub)) {
      return stub;
    }
    const prefix =
      params.source.length > 0 && !endsWithLineBreak(params.source) ? "\n" : "";
    const replacement = `${prefix}${stub.value}`;
    const nextSource = `${params.source}${replacement}`;
    const offset = params.source.length + prefix.length;
    return Result.ok({
      edit: {
        start: params.source.length,
        end: params.source.length,
        replacement,
      },
      caret: CaretPosition.atOffset(nextSource, offset),
    });
  },
} as const;
