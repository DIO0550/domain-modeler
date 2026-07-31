import { type Option, Option as OptionValue } from "../../option";
import type { DocumentCommand } from "../document-command";

const HISTORY_LIMIT = 100;

/** 文書コマンドを後入れ先出しで保持するスタック。 */
export type CommandStack = readonly DocumentCommand[];

/** 文書コマンドスタックを生成、更新する関数群。 */
export const CommandStack = {
  /**
   * 空の文書コマンドスタックを生成する。
   * @returns コマンドを持たないスタック。
   */
  empty: (): CommandStack => [],
  /**
   * 文書コマンドをスタックの末尾へ積む。
   * @param stack コマンドを積む前のスタック。
   * @param command 積む文書コマンド。
   * @returns コマンドを積み、上限を超えた古いコマンドを破棄したスタック。
   */
  push: (stack: CommandStack, command: DocumentCommand): CommandStack =>
    [...stack, command].slice(-HISTORY_LIMIT),
  /**
   * スタックの末尾から文書コマンドを取り出す。
   * @param stack コマンドを取り出すスタック。
   * @returns 取り出したコマンドと残りのスタック。空の場合は値なし。
   */
  pop: (
    stack: CommandStack,
  ): Option<Readonly<{ command: DocumentCommand; remaining: CommandStack }>> => {
    const command = stack[stack.length - 1];
    return command === undefined
      ? OptionValue.none()
      : OptionValue.some({ command, remaining: stack.slice(0, -1) });
  },
} as const;
