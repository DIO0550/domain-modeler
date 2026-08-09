import type { SourceRange } from "../source-range";
import type { TypeTerm } from "../type-term";

/** workflow の input / output 節。 */
export type WorkflowSection = Readonly<{
  terms: readonly TypeTerm[];
  range: SourceRange;
}>;

/**
 * workflow の error 節。
 * 省略時は `present: false` とし、terms を持たせない。
 */
export type WorkflowErrorClause =
  | Readonly<{
      present: true;
      terms: readonly TypeTerm[];
      range: SourceRange;
    }>
  | Readonly<{ present: false }>;

/** workflow 宣言。 */
export type WorkflowDecl = Readonly<{
  kind: "workflow";
  name: string;
  nameRange: SourceRange;
  input: WorkflowSection;
  output: WorkflowSection;
  error: WorkflowErrorClause;
  range: SourceRange;
}>;

/** WorkflowDecl を生成するときの引数。 */
export type WorkflowDeclCreateParams = Readonly<{
  name: string;
  nameRange: SourceRange;
  input: WorkflowSection;
  output: WorkflowSection;
  error: WorkflowErrorClause;
  range: SourceRange;
}>;

/** workflow の節を生成する関数群。 */
export const WorkflowSection = {
  /**
   * 型参照項の列と位置から節を生成する。
   * @param terms 型参照項。
   * @param range 節のソース範囲。
   * @returns workflow 節。
   */
  create: (
    terms: readonly TypeTerm[],
    range: SourceRange,
  ): WorkflowSection => ({ terms, range }),
} as const;

/** error 節の有無を組み立てる関数群。 */
export const WorkflowErrorClause = {
  /**
   * error 節ありを生成する。
   * @param terms 型参照項。
   * @param range 節のソース範囲。
   * @returns present: true の error 節。
   */
  present: (
    terms: readonly TypeTerm[],
    range: SourceRange,
  ): WorkflowErrorClause => ({ present: true, terms, range }),
  /**
   * error 節なしを生成する。
   * @returns present: false。
   */
  absent: (): WorkflowErrorClause => ({ present: false }),
} as const;

/** workflow 宣言を生成・判定する関数群。 */
export const WorkflowDecl = {
  /**
   * 名前・各節・位置から workflow 宣言を生成する。
   * @param params 生成パラメータ。
   * @returns workflow 宣言。
   */
  create: (params: WorkflowDeclCreateParams): WorkflowDecl => ({
    kind: "workflow",
    name: params.name,
    nameRange: params.nameRange,
    input: params.input,
    output: params.output,
    error: params.error,
    range: params.range,
  }),
  /**
   * error 節を持つか判定する。
   * @param decl workflow 宣言。
   * @returns error 節がある場合は `true`。
   */
  hasError: (
    decl: WorkflowDecl,
  ): decl is WorkflowDecl & {
    error: Extract<WorkflowErrorClause, { present: true }>;
  } => decl.error.present,
} as const;
