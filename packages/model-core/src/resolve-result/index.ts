import type { DefinitionTable } from "../definition-table";
import type { Diagnostic } from "../diagnostic";
import type { ReferenceTable } from "../reference-table";

/** 参照解決の結果。 */
export type ResolveResult = Readonly<{
  definitions: DefinitionTable;
  references: ReferenceTable;
  diagnostics: readonly Diagnostic[];
}>;

/** ResolveResult を生成するときの引数。 */
export type ResolveResultCreateParams = Readonly<{
  definitions: DefinitionTable;
  references: ReferenceTable;
  diagnostics: readonly Diagnostic[];
}>;

/** 参照解決結果を生成する関数群。 */
export const ResolveResult = {
  /**
   * 定義表・参照表・診断から参照解決結果を生成する。
   * @param params 生成パラメータ。
   * @returns 参照解決結果。
   */
  create: (params: ResolveResultCreateParams): ResolveResult => ({
    definitions: params.definitions,
    references: params.references,
    diagnostics: params.diagnostics,
  }),
} as const;
