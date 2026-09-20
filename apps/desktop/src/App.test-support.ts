/** 保存セッションの flush 操作。true なら保存済み。 */
export type SaveSession = () => Promise<boolean>;

/**
 * 1回目の flush だけを保留し、2回目以降は即座に保存済みを返すセッションを組み立てる。
 * 終了保存中に再編集が入る状況を再現するために使う。
 *
 * @returns 保留中の1回目を完了させる操作と、flush 操作本体。
 */
export function slowFirstFlushSession(): Readonly<{
  finish: (saved: boolean) => void;
  flush: SaveSession;
}> {
  const pending = { resolve: (_saved: boolean) => {} };
  let flushCount = 0;
  return {
    finish: (saved) => pending.resolve(saved),
    flush: async () => {
      flushCount += 1;
      if (flushCount > 1) {
        return true;
      }
      return await new Promise<boolean>((resolve) => {
        pending.resolve = resolve;
      });
    },
  };
}
