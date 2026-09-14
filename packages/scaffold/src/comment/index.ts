/** DSL のコメントとして残すテキスト。 */
export type Comment = Readonly<{ prefix: string; text: string }>;

/** 改行を含むテキストを安全なコメント行へ変換する。 */
export const Comment = {
  lines: ({ prefix, text }: Comment): readonly string[] => {
    const [first = "", ...rest] = text.split(/\r\n|[\r\n\u2028\u2029]/u);
    return [`${prefix}${first}`, ...rest.map((line) => `// ${line}`)];
  },
} as const;
