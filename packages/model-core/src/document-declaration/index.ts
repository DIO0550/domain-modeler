import type { Declaration } from "../document";
import type { NamedDecl } from "../named-decl";
import type { StateMachineDecl } from "../state-machine-decl";

/** 文書直下に置かれ、文書全体で名前を共有する宣言。 */
export type DocumentDeclaration = NamedDecl | StateMachineDecl;

/** 文書直下の名前付き宣言の判定。 */
export const DocumentDeclaration = {
  /**
   * 文書直下の名前付き宣言か判定する。
   * @param declaration 判定対象。
   * @returns data、workflow、state-machine の場合は true。
   */
  is: (declaration: Declaration): declaration is DocumentDeclaration =>
    declaration.kind === "data" ||
    declaration.kind === "workflow" ||
    declaration.kind === "state-machine",
} as const;
