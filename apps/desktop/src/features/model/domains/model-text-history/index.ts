/** 1回の文書更新を1つの履歴項目として保持する。 */
export type ModelTextHistory = Readonly<{
  current: string;
  past: readonly string[];
  future: readonly string[];
}>;

export const ModelTextHistory = {
  create(current: string): ModelTextHistory {
    return { current, past: [], future: [] };
  },

  record(history: ModelTextHistory, next: string): ModelTextHistory {
    if (history.current === next) {
      return history;
    }

    return {
      current: next,
      past: [...history.past, history.current],
      future: [],
    };
  },

  undo(history: ModelTextHistory): ModelTextHistory {
    const previous = history.past[history.past.length - 1];

    if (previous === undefined) {
      return history;
    }

    return {
      current: previous,
      past: history.past.slice(0, -1),
      future: [history.current, ...history.future],
    };
  },

  redo(history: ModelTextHistory): ModelTextHistory {
    const next = history.future[0];

    if (next === undefined) {
      return history;
    }

    return {
      current: next,
      past: [...history.past, history.current],
      future: history.future.slice(1),
    };
  },
} as const;
