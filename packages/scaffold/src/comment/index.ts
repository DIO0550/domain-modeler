/** DSL のコメントとして残すテキスト。 */
export type Comment = Readonly<{ prefix: string; text: string }>;

/** 改行を含むテキストを安全なコメント行へ変換する。 */
export const Comment = {
  /** 接続先の本文とラベルを workflow 直前のコメントにする。 */
  connectionLines: (
    connection: Readonly<{ text: string; label: string }>,
  ): readonly string[] => {
    const destination = Comment.lines({
      prefix: "// -> ",
      text: connection.text,
    });
    if (connection.label.length === 0) {
      return destination;
    }
    const label = Comment.lines({ prefix: "// ", text: connection.label });
    return [...destination, ...label];
  },
  lines: ({ prefix, text }: Comment): readonly string[] => {
    const [first = "", ...rest] = text.split(/\r\n|[\r\n\u2028\u2029]/u);
    return [`${prefix}${first}`, ...rest.map((line) => `// ${line}`)];
  },
} as const;
