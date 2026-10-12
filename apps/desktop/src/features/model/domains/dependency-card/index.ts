import {
  NumberRange,
  type ModelGraph,
  type TypeTerm,
} from "@domain-modeler/model-core";

/** 図のカードに表示する宣言種別と読み取り専用の行。 */
export type DependencyCard = Readonly<{
  id: string;
  name: string;
  kind: "ALIAS" | "RECORD" | "CHOICE" | "VALUE" | "WORKFLOW" | "未定義";
  rows: readonly Readonly<{ label: string; text: string }>[];
}>;

/** ASTの構造・修飾順・制約を、カード用の文言へ変換する。 */
export const DependencyCard = {
  create(node: ModelGraph["nodes"][number]): DependencyCard {
    const common = { id: node.id, name: node.label };

    if (node.kind === "unresolved") {
      return {
        ...common,
        kind: "未定義",
        rows: [{ label: "警告", text: "定義がありません" }],
      };
    }

    if (node.kind === "workflow") {
      const declaration = node.declaration;
      const input = {
        label: "入力",
        text: declaration.input.terms
          .map(DependencyCard.termText)
          .join(" AND "),
      };
      const output = {
        label: "出力",
        text: declaration.output.terms
          .map(DependencyCard.termText)
          .join(" OR "),
      };
      const errors = declaration.error.present
        ? [
            {
              label: "エラー",
              text: declaration.error.terms
                .map(DependencyCard.termText)
                .join(" OR "),
            },
          ]
        : [];

      return { ...common, kind: "WORKFLOW", rows: [input, output, ...errors] };
    }

    const expression = node.declaration.typeExpr;

    switch (expression.form) {
      case "alias":
        return {
          ...common,
          kind: node.cardKind,
          rows: [
            { label: "別名", text: DependencyCard.termText(expression.term) },
          ],
        };

      case "record":
        return {
          ...common,
          kind: node.cardKind,
          rows: expression.terms.map((term) => ({
            label: "AND",
            text: DependencyCard.termText(term),
          })),
        };

      case "choice":
        return {
          ...common,
          kind: node.cardKind,
          rows: expression.terms.map((term) => ({
            label: "OR",
            text: DependencyCard.termText(term),
          })),
        };

      case "value": {
        const constraintLabel =
          expression.constraint.kind === "length" ? "長さ" : "範囲";

        return {
          ...common,
          kind: node.cardKind,
          rows: [
            { label: "型", text: expression.primitive },
            {
              label: constraintLabel,
              text: NumberRange.toSource(expression.constraint.bounds),
            },
          ],
        };
      }
    }
  },

  termText(term: TypeTerm): string {
    return [term.name, ...term.modifiers].join(" ");
  },
} as const;
