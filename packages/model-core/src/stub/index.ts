import { Identifier } from "../identifier";
import { Result, type Result as ResultType } from "../result";

/** data 宣言のスタブ生成結果。 */
export type Stub = `data ${string} = string // TODO 詳細化`;

/** data 宣言のスタブを生成する関数群。 */
export const Stub = {
  /**
   * 識別子として使用できる名前から data 宣言のスタブを生成する。
   * @param name data 宣言に使用する名前。
   * @returns 生成したスタブ。名前が識別子として使用できない場合は失敗結果。
   */
  generate: (name: string): ResultType<Stub, "invalid_identifier"> => {
    if (!Identifier.isAcceptable(name)) {
      return Result.err("invalid_identifier");
    }
    const stub: Stub = `data ${name} = string // TODO 詳細化`;
    return Result.ok(stub);
  },
} as const;
