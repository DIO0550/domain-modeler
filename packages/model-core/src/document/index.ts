import type { DataDecl } from "../data-decl";
import type { ErrorDecl } from "../error-decl";
import type { SourceRange } from "../source-range";
import type { WorkflowDecl } from "../workflow-decl";

/** 文書内の1宣言(data / workflow / エラー宣言)。 */
export type Declaration = DataDecl | WorkflowDecl | ErrorDecl;

/** `.dmodel` 文書の AST ルート。宣言は出現順。 */
export type Document = Readonly<{
  declarations: readonly Declaration[];
  range: SourceRange;
}>;

/** 宣言の種別を判定する関数群。 */
export const Declaration = {
  /**
   * data 宣言か判定する。
   * @param declaration 判定する宣言。
   * @returns data 宣言の場合は `true`。
   */
  isData: (declaration: Declaration): declaration is DataDecl =>
    declaration.kind === "data",
  /**
   * workflow 宣言か判定する。
   * @param declaration 判定する宣言。
   * @returns workflow 宣言の場合は `true`。
   */
  isWorkflow: (declaration: Declaration): declaration is WorkflowDecl =>
    declaration.kind === "workflow",
  /**
   * エラー宣言か判定する。
   * @param declaration 判定する宣言。
   * @returns エラー宣言の場合は `true`。
   */
  isError: (declaration: Declaration): declaration is ErrorDecl =>
    declaration.kind === "error",
} as const;

/** 文書 AST を生成する関数群。 */
export const Document = {
  /**
   * 宣言列と文書範囲から Document を生成する。
   * @param declarations 出現順の宣言列。
   * @param range 文書全体のソース範囲。
   * @returns 文書 AST。
   */
  create: (
    declarations: readonly Declaration[],
    range: SourceRange,
  ): Document => ({ declarations, range }),
} as const;
