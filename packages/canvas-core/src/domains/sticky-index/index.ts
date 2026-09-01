import { type Option, Option as OptionValue } from "../option";
import type { Sticky, StickyId } from "../sticky";

/** 付箋IDから付箋を定数時間で解決する索引。 */
export interface StickyIndex {
  readonly byId: ReadonlyMap<StickyId, Sticky>;
}

/** 付箋索引を生成、参照する関数群。 */
export const StickyIndex = {
  /**
   * 付箋一覧からID索引を生成する。
   * @param stickies 索引へ登録する付箋。
   * @returns IDごとに付箋を保持する索引。
   */
  create: (stickies: readonly Sticky[]): StickyIndex => ({
    byId: new Map(stickies.map((sticky) => [sticky.id, sticky])),
  }),
  /**
   * 指定したIDの付箋を取得する。
   * @param index 検索対象の索引。
   * @param stickyId 探す付箋のID。
   * @returns 一致した付箋。該当する付箋がなければ値なし。
   */
  get: (index: StickyIndex, stickyId: StickyId): Option<Sticky> => {
    const sticky = index.byId.get(stickyId);
    return sticky === undefined
      ? OptionValue.none()
      : OptionValue.some(sticky);
  },
} as const;
