import type { Diagnostic } from "../../diagnostic";
import type { Declaration } from "../../document";

/** 宣言チャンクを AST へ変換した結果。 */
export type MaterializedDecl = Readonly<{
  declaration: Declaration;
  diagnostics: readonly Diagnostic[];
}>;
