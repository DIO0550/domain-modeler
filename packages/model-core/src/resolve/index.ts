import { DataDecl } from "../data-decl";
import { DIAGNOSTIC_SEVERITIES, Diagnostic } from "../diagnostic";
import { Declaration, type Document } from "../document";
import type { SourceRange } from "../source-range";
import { TypeTerm } from "../type-term";
import { WorkflowDecl } from "../workflow-decl";

/** 定義表に載る宣言(data / workflow)。 */
export type NamedDecl = DataDecl | WorkflowDecl;

/** 識別子 → 宣言(先頭の定義を保持)。 */
export type DefinitionTable = Readonly<Record<string, NamedDecl>>;

/** 識別子 → 宣言名・型参照の全出現位置。 */
export type ReferenceTable = Readonly<Record<string, readonly SourceRange[]>>;

/** 参照解決の結果。 */
export type ResolveResult = Readonly<{
  definitions: DefinitionTable;
  references: ReferenceTable;
  diagnostics: readonly Diagnostic[];
}>;

type DefinitionAcc = Readonly<{
  definitions: DefinitionTable;
  diagnostics: readonly Diagnostic[];
}>;

/**
 * 参照解決対象の型参照項か判定する。
 * プリミティブ型は対象外(model-core.md §7)。
 * @param term 型参照項。
 * @returns 名前付き参照の場合は `true`。
 */
const isResolvableReference = (term: TypeTerm): boolean => !term.isPrimitive;

/**
 * 宣言に含まれる型参照項を列挙する。
 * @param decl data または workflow 宣言。
 * @returns 型参照項の列。
 */
const referencedTermsOf = (decl: NamedDecl): readonly TypeTerm[] =>
  decl.kind === "data"
    ? DataDecl.referencedTerms(decl)
    : WorkflowDecl.referencedTerms(decl);

/**
 * 識別子の出現を参照表へ追記する。
 * @param references 参照表。
 * @param name 識別子。
 * @param range 出現位置。
 * @returns 更新後の参照表。
 */
const appendOccurrence = (
  references: ReferenceTable,
  name: string,
  range: SourceRange,
): ReferenceTable => ({
  ...references,
  [name]: [...(references[name] ?? []), range],
});

/**
 * data / workflow 宣言から定義表を構築し、重複を診断する。
 * @param declarations 出現順の名前付き宣言。
 * @returns 定義表と重複診断。
 */
const collectDefinitions = (
  declarations: readonly NamedDecl[],
): DefinitionAcc =>
  declarations.reduce<DefinitionAcc>(
    (acc, decl) => {
      if (Object.prototype.hasOwnProperty.call(acc.definitions, decl.name)) {
        return {
          definitions: acc.definitions,
          diagnostics: [
            ...acc.diagnostics,
            Diagnostic.create(
              DIAGNOSTIC_SEVERITIES.error,
              `「${decl.name}」は既に宣言されています`,
              decl.nameRange,
            ),
          ],
        };
      }
      return {
        definitions: { ...acc.definitions, [decl.name]: decl },
        diagnostics: acc.diagnostics,
      };
    },
    { definitions: {}, diagnostics: [] },
  );

/**
 * 宣言名・型参照の出現位置を参照表へ集める。
 * @param declarations 出現順の名前付き宣言。
 * @returns 参照表。
 */
const collectReferences = (
  declarations: readonly NamedDecl[],
): ReferenceTable =>
  declarations.reduce<ReferenceTable>((references, decl) => {
    const withDefinition = appendOccurrence(
      references,
      decl.name,
      decl.nameRange,
    );
    return referencedTermsOf(decl).reduce(
      (next, term) =>
        isResolvableReference(term)
          ? appendOccurrence(next, term.name, TypeTerm.nameRange(term))
          : next,
      withDefinition,
    );
  }, {});

/**
 * 未定義の型参照を警告診断にする。
 * @param declarations 出現順の名前付き宣言。
 * @param definitions 定義表。
 * @returns 未定義参照の警告列。
 */
const undefinedReferenceDiagnostics = (
  declarations: readonly NamedDecl[],
  definitions: DefinitionTable,
): readonly Diagnostic[] =>
  declarations.flatMap((decl) =>
    referencedTermsOf(decl)
      .filter(isResolvableReference)
      .filter(
        (term) =>
          !Object.prototype.hasOwnProperty.call(definitions, term.name),
      )
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
    const namedDeclarations = document.declarations.filter(
      (declaration): declaration is NamedDecl =>
        Declaration.isData(declaration) || Declaration.isWorkflow(declaration),
    );
    const { definitions, diagnostics: duplicateDiagnostics } =
      collectDefinitions(namedDeclarations);
    return {
      definitions,
      references: collectReferences(namedDeclarations),
      diagnostics: [
        ...duplicateDiagnostics,
        ...undefinedReferenceDiagnostics(namedDeclarations, definitions),
      ],
    };
  },
} as const;
