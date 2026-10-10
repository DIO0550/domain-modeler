import type { Diagnostic } from "../diagnostic";
import type { Document } from "../document";
import { DocumentDeclaration } from "../document-declaration";
import { NamedDecl } from "../named-decl";
import type { ResolveResult } from "../resolve-result";
import { SourceRange } from "../source-range";
import { ModelGraphEdge } from "./edge";
import { ModelGraphNode } from "./node";
import { ModelGraphReference } from "./reference";

/** 一文書リビジョンから導出した意味的な依存グラフ。座標や本文更新を持たない。 */
export type ModelGraph = Readonly<{
  revision: number;
  nodes: readonly ModelGraphNode[];
  references: readonly ModelGraphReference[];
  edges: readonly ModelGraphEdge[];
  /** 宣言ノードに所属しない構文・意味診断。 */
  diagnostics: readonly Diagnostic[];
}>;

/** data・workflowの構文上の参照を、既存の参照解決結果から導出する。 */
export const ModelGraph = {
  /**
   * 採用済み本文の同一リビジョンに対応するAST・参照解決・全診断を受け取る。
   * 全診断には構文診断と意味診断を含める。宣言間を再帰せず、循環もそのまま辺にする。
   * @param analysis 同一文書リビジョンの解析結果。
   * @returns 出現順のノード・参照・辺と、ノードに所属しない診断。
   */
  create(
    analysis: Readonly<{
      revision: number;
      document: Document;
      resolution: ResolveResult;
      diagnostics: readonly Diagnostic[];
    }>,
  ): ModelGraph {
    const declarations = analysis.document.declarations.filter(NamedDecl.is);
    const references = declarations.flatMap((declaration) =>
      ModelGraphReference.collect(
        declaration,
        analysis.resolution.definitions,
        analysis.diagnostics,
      ),
    );

    // ラベルの重複判定には、図の対象外宣言も含める。
    const documentDeclarations = analysis.document.declarations.filter(
      DocumentDeclaration.is,
    );
    const nodes = declarations.map((declaration) =>
      ModelGraphNode.create(declaration, {
        declarations: documentDeclarations,
        references,
        diagnostics: analysis.diagnostics,
      }),
    );
    const unresolvedNodes = ModelGraphNode.collectUnresolved(
      references,
      analysis.diagnostics,
    );
    const allNodes = [...nodes, ...unresolvedNodes].sort((left, right) =>
      SourceRange.compare({ left: left.range, right: right.range }),
    );

    return {
      revision: analysis.revision,
      nodes: allNodes,
      references,
      edges: ModelGraphEdge.collect(references),
      diagnostics: analysis.diagnostics.filter(
        (diagnostic) =>
          !nodes.some((node) => node.diagnostics.includes(diagnostic)),
      ),
    };
  },

  /**
   * 選択ノードと、そのノードに直接つながる辺・もう一端だけを返す。
   * @param graph 意味的なグラフ。
   * @param selectedId 選択ノードのID。
   * @returns 出現順を保った直接近傍。存在しないIDなら空集合。
   */
  neighborhood(
    graph: ModelGraph,
    selectedId: string,
  ): Pick<ModelGraph, "nodes" | "edges"> {
    const edges = graph.edges.filter(
      (edge) => edge.from === selectedId || edge.to === selectedId,
    );
    const ids = new Set([
      selectedId,
      ...edges.flatMap((edge) => [edge.from, edge.to]),
    ]);

    return { nodes: graph.nodes.filter((node) => ids.has(node.id)), edges };
  },
} as const;
