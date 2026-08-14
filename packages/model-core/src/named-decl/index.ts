import { DataDecl } from "../data-decl";
import type { Declaration } from "../document";
import type { TypeTerm } from "../type-term";
import { WorkflowDecl } from "../workflow-decl";

/** 定義表に載る宣言(data / workflow)。 */
export type NamedDecl = DataDecl | WorkflowDecl;

/** 名前付き宣言を判定・変換する関数群。 */
export const NamedDecl = {
  /**
   * data または workflow 宣言か判定する。
   * @param declaration 判定する宣言。
   * @returns 名前付き宣言の場合は `true`。
   */
  is: (declaration: Declaration): declaration is NamedDecl =>
    declaration.kind === "data" || declaration.kind === "workflow",
  /**
   * 宣言に含まれる型参照項を列挙する。
   * @param decl data または workflow 宣言。
   * @returns 型参照項の列。
   */
  referencedTerms: (decl: NamedDecl): readonly TypeTerm[] =>
    decl.kind === "data"
      ? DataDecl.referencedTerms(decl)
      : WorkflowDecl.referencedTerms(decl),
} as const;
