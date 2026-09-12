import {
  DefinitionTable,
  NamedDecl,
  Parse,
  Resolve,
  TypeTerm,
  type Diagnostic,
  type Document,
  type Token,
} from "@domain-modeler/model-core";

/** パースと参照解決をまとめた文書。 */
export type AnalyzedModel = Readonly<{
  document: Document;
  tokens: readonly Token[];
  diagnostics: readonly Diagnostic[];
  undefinedTypeNames: ReadonlySet<string>;
}>;

/**
 * 未定義の型名を定義表から集める。
 * @param document パース済みの文書。
 * @returns 未定義の型名。
 */
const collectUndefinedTypeNames = (
  document: AnalyzedModel["document"],
): ReadonlySet<string> => {
  const namedDeclarations = document.declarations.filter(NamedDecl.is);
  const definitions = DefinitionTable.create(namedDeclarations);
  return new Set(
    namedDeclarations.flatMap((decl) =>
      NamedDecl.referencedTerms(decl)
        .filter(TypeTerm.isResolvable)
        .filter((term) => !DefinitionTable.has(definitions, term.name))
        .map((term) => term.name),
    ),
  );
};

/** 入力テキストからパースと参照解決の結果を組み立てる関数群。 */
export const AnalyzedModel = {
  /**
   * ソース全文を解析し、パース診断と参照解決診断をまとめる。
   * 失敗しても例外は投げず、診断として返す。
   * @param source `.dmodel` テキスト。
   * @returns 文書・トークン・診断・未定義型名。
   */
  from(source: string): AnalyzedModel {
    const parsed = Parse.parse(source);
    const resolved = Resolve.resolve(parsed.document);
    const diagnostics = [...parsed.diagnostics, ...resolved.diagnostics];
    return {
      document: parsed.document,
      tokens: parsed.tokens,
      diagnostics,
      undefinedTypeNames: collectUndefinedTypeNames(parsed.document),
    };
  },
} as const;
