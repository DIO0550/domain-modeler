import { DIAGNOSTIC_SEVERITIES, Diagnostic } from "../diagnostic";
import type { NamedDecl } from "../named-decl";

/** 識別子 → 宣言(先頭の定義を保持)。 */
export type DefinitionTable = Readonly<Record<string, NamedDecl>>;

/**
 * 定義表に名前が載っているか判定する。
 * @param table 定義表。
 * @param name 識別子。
 * @returns 載っている場合は `true`。
 */
const hasName = (table: DefinitionTable, name: string): boolean =>
  Object.prototype.hasOwnProperty.call(table, name);

/** 定義表を生成・判定する関数群。 */
export const DefinitionTable = {
  /**
   * 出現順の名前付き宣言から定義表を生成する。
   * 同名が複数ある場合は先頭の定義を残す。
   * @param declarations 出現順の名前付き宣言。
   * @returns 定義表。
   */
  create: (declarations: readonly NamedDecl[]): DefinitionTable =>
    declarations.reduce<DefinitionTable>(
      (table, decl) =>
        hasName(table, decl.name) ? table : { ...table, [decl.name]: decl },
      {},
    ),
  /**
   * 定義表に名前が載っているか判定する。
   * @param table 定義表。
   * @param name 識別子。
   * @returns 載っている場合は `true`。
   */
  has: hasName,
  /**
   * 同名の再宣言をエラー診断として集める。
   * @param declarations 出現順の名前付き宣言。
   * @returns 再宣言のエラー診断。
   */
  collectRedeclarationErrors: (
    declarations: readonly NamedDecl[],
  ): readonly Diagnostic[] =>
    declarations.reduce<
      Readonly<{ names: readonly string[]; errors: readonly Diagnostic[] }>
    >(
      (acc, decl) => {
        if (acc.names.includes(decl.name)) {
          return {
            names: acc.names,
            errors: [
              ...acc.errors,
              Diagnostic.create(
                DIAGNOSTIC_SEVERITIES.error,
                `「${decl.name}」は既に宣言されています`,
                decl.nameRange,
              ),
            ],
          };
        }
        return {
          names: [...acc.names, decl.name],
          errors: acc.errors,
        };
      },
      { names: [], errors: [] },
    ).errors,
} as const;
