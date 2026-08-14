import { NamedDecl } from "../named-decl";
import type { SourceRange } from "../source-range";
import { TypeTerm } from "../type-term";

/** 識別子 → 宣言名・型参照の全出現位置。 */
export type ReferenceTable = Readonly<Record<string, readonly SourceRange[]>>;

/**
 * 識別子の出現を参照表へ追記する。
 * @param table 参照表。
 * @param name 識別子。
 * @param range 出現位置。
 * @returns 更新後の参照表。
 */
const append = (
  table: ReferenceTable,
  name: string,
  range: SourceRange,
): ReferenceTable => ({
  ...table,
  [name]: [...(table[name] ?? []), range],
});

/** 参照表を生成する関数群。 */
export const ReferenceTable = {
  /**
   * 宣言名・型参照の出現位置から参照表を生成する。
   * プリミティブ型への参照は含めない。
   * @param declarations 出現順の名前付き宣言。
   * @returns 参照表。
   */
  create: (declarations: readonly NamedDecl[]): ReferenceTable =>
    declarations.reduce<ReferenceTable>((table, decl) => {
      const withDefinition = append(table, decl.name, decl.nameRange);
      return NamedDecl.referencedTerms(decl).reduce(
        (next, term) =>
          TypeTerm.isResolvable(term)
            ? append(next, term.name, TypeTerm.nameRange(term))
            : next,
        withDefinition,
      );
    }, {}),
} as const;
