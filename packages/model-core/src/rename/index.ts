import type { ReferenceTable } from "../reference-table";
import type { SourceRange } from "../source-range";

/** リネーム用の置換範囲を集める関数群。 */
export const Rename = {
  /**
   * 宣言名と型参照の出現位置から、指定識別子の一括置換範囲を返す。
   * コメント内の文字列や、同名部分文字列を含む別識別子は含まない。
   * @param references 参照表。
   * @param name リネームする識別子。
   * @returns 出現順のソース範囲。名前が無い場合は空配列。
   */
  collectRanges: (
    references: ReferenceTable,
    name: string,
  ): readonly SourceRange[] => {
    if (!Object.prototype.hasOwnProperty.call(references, name)) {
      return [];
    }
    return references[name] ?? [];
  },
} as const;
