import { Comment } from "../comment";

/** 入出力の参照項と、方向ごとの結合規則。 */
export type WorkflowPort = Readonly<{
  terms: readonly Readonly<{ text: string; label: string }>[];
}> &
  (
    | Readonly<{
        direction: "input";
        operator: "AND";
        fallback: "TODOトリガーイベント";
      }>
    | Readonly<{
        direction: "output";
        operator: "OR";
        fallback: "TODO結果イベント";
      }>
  );

/** workflow の参照項をラベル付きの DSL にする。 */
export const WorkflowPort = {
  toDmodelText: (port: WorkflowPort): string => {
    if (port.terms.length === 0) {
      return `  ${port.direction}: ${port.fallback}`;
    }
    if (port.terms.every((event) => event.label.length === 0)) {
      const names = [...new Set(port.terms.map((event) => event.text))];
      return `  ${port.direction}: ${names.join(` ${port.operator} `)}`;
    }
    const terms = port.terms.map((event, index) => {
      const prefix =
        index === 0 ? `  ${port.direction}: ` : `    ${port.operator} `;
      const term = `${prefix}${event.text}`;
      if (event.label.length === 0) {
        return term;
      }
      return Comment.lines({ prefix: `${term} // `, text: event.label })
        .map((line, lineIndex) => (lineIndex === 0 ? line : `    ${line}`))
        .join("\n");
    });
    return terms.join("\n");
  },
} as const;
