import { useState } from "react";
import { ModelTextHistory } from "../../domains/model-text-history";

type UseModelTextHistoryParams = Readonly<{
  value: string;
  onChange: (value: string) => void;
}>;

/** モデル定義とグラフの編集を同じ文書履歴に記録する。 */
export function useModelTextHistory({
  value,
  onChange,
}: UseModelTextHistoryParams) {
  const [history, setHistory] = useState(() => ModelTextHistory.create(value));

  if (history.current !== value) {
    // 外部ファイル更新・別文書への切替は以前の文書の履歴を引き継がない。
    setHistory(ModelTextHistory.create(value));
  }

  const active =
    history.current === value ? history : ModelTextHistory.create(value);

  const change = (next: string) => {
    if (next === value) {
      return;
    }

    setHistory(ModelTextHistory.record(active, next));
    onChange(next);
  };

  const undo = () => {
    const next = ModelTextHistory.undo(active);

    if (next === active) {
      return;
    }

    setHistory(next);
    onChange(next.current);
  };

  const redo = () => {
    const next = ModelTextHistory.redo(active);

    if (next === active) {
      return;
    }

    setHistory(next);
    onChange(next.current);
  };

  return {
    change,
    undo,
    redo,
    canUndo: active.past.length > 0,
    canRedo: active.future.length > 0,
  };
}
