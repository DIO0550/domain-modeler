import type { History as HistoryType } from "./domains/history";
import { History } from "./domains/history";
import { ReplaceDocumentCommand } from "./domains/history/document-command";
import type { Result as ResultType } from "./domains/result";
import { Result } from "./domains/result";
import { Serialize } from "./serialize";

/** 外部変更を履歴付きで取り込む関数群。 */
export const ExternalChanges = {
  /**
   * 外部 JSON を検証し、成功時は Document 全体を置換して履歴へ積む。
   * 失敗時は History を変更せずエラーを返す。
   * @param history 取り込み前の履歴。
   * @param json 外部から得た `.dcanvas` JSON 文字列。
   * @returns 成功時は更新後 History、失敗時は CanvasError。
   */
  apply: (history: HistoryType, json: string): ResultType<HistoryType> => {
    const parsed = Serialize.parse(json);
    if (!parsed.ok) {
      return parsed;
    }
    return Result.ok(
      History.execute(
        history,
        ReplaceDocumentCommand.create({
          previous: history.current,
          next: parsed.value,
        }),
      ),
    );
  },
} as const;
