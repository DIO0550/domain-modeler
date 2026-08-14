import { DefinitionTable } from "../definition-table";
import { DIAGNOSTIC_SEVERITIES, Diagnostic } from "../diagnostic";
import type { Document } from "../document";
import { NamedDecl } from "../named-decl";
import { ReferenceTable } from "../reference-table";
import { ResolveResult } from "../resolve-result";
import { TypeTerm } from "../type-term";

/**
 * 未定義の型参照を警告診断として集める。
 * @param declarations 出現順の名前付き宣言。
 * @param definitions 定義表。
 * @returns 未定義参照の警告列。
 */
const collectUndefinedReferenceWarnings = (
  declarations: readonly NamedDecl[],
  definitions: DefinitionTable,
): readonly Diagnostic[] =>
  declarations.flatMap((decl) =>
    NamedDecl.referencedTerms(decl)
      .filter(TypeTerm.isResolvable)
      .filter((term) => !DefinitionTable.has(definitions, term.name))
      .map((term) =>
        Diagnostic.create(
          DIAGNOSTIC_SEVERITIES.warning,
          `「${term.name}」は未定義です`,
          TypeTerm.nameRange(term),
        ),
      ),
  );

/** 文書の定義表・参照表を構築し、意味診断を返す関数群。 */
export const Resolve = {
  /**
   * 全文パース後の AST に対して参照解決を行う。
   * 前方参照は定義表を一括構築してから検査するため警告にならない。
   * コメントは AST に含まれないため参照表・診断の対象外になる。
   * @param document 文書 AST。
   * @returns 定義表・参照表・診断。
   */
  resolve: (document: Document): ResolveResult => {
    const namedDeclarations = document.declarations.filter(NamedDecl.is);
    const definitions = DefinitionTable.create(namedDeclarations);
    return ResolveResult.create({
      definitions,
      references: ReferenceTable.create(namedDeclarations),
      diagnostics: [
        ...DefinitionTable.collectRedeclarationErrors(namedDeclarations),
        ...collectUndefinedReferenceWarnings(namedDeclarations, definitions),
      ],
    });
  },
} as const;
