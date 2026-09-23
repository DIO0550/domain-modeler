import type { Declaration } from "../document";
import type { NamedDecl } from "../named-decl";
import type { StateMachineDecl } from "../state-machine-decl";

/** 文書全体で名前を共有する宣言。 */
export type TopLevelDecl = NamedDecl | StateMachineDecl;

/** トップレベル宣言の判定。 */
export const TopLevelDecl = {
  /**
   * 名前を持つトップレベル宣言か判定する。
   * @param declaration 判定対象。
   * @returns data、workflow、state-machine の場合は true。
   */
  is: (declaration: Declaration): declaration is TopLevelDecl =>
    declaration.kind === "data" ||
    declaration.kind === "workflow" ||
    declaration.kind === "state-machine",
} as const;
