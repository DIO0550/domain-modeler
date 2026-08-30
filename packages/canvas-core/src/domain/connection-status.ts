import { STICKY_TYPES, type StickyType } from "./sticky";

/** 接続のソフト警告判定結果。問題なしまたは警告。 */
export type ConnectionStatus = "ok" | "warning";

/** 推奨される接続の種別ペア(許可リスト)。 */
const ALLOWED_PAIRS = [
  ["actor", "command"],
  ["command", "aggregate"],
  ["aggregate", "event"],
  ["event", "policy"],
  ["policy", "command"],
  ["event", "readModel"],
  ["readModel", "actor"],
  ["command", "externalSystem"],
  ["externalSystem", "event"],
] as const satisfies ReadonlyArray<readonly [StickyType, StickyType]>;

const ALLOWED_PAIR_KEYS = new Set(
  ALLOWED_PAIRS.map(([from, to]) => `${from}->${to}`),
);

/** 接続のソフト警告を判定する関数群。 */
export const ConnectionStatus = {
  /**
   * 始点・終点の種別ペアから接続状態を返す。
   * hotspot を含む接続は常に問題なし。それ以外は許可リストに含まれるときのみ問題なし。
   * @param from 始点の付箋種別。
   * @param to 終点の付箋種別。
   * @returns 問題なしのとき `"ok"`、推奨ルール外のとき `"warning"`。
   */
  between: (from: StickyType, to: StickyType): ConnectionStatus => {
    if (from === "hotspot" || to === "hotspot") {
      return "ok";
    }
    return ALLOWED_PAIR_KEYS.has(`${from}->${to}`) ? "ok" : "warning";
  },

  /**
   * 始点の種別から推奨される接続先種別を返す。
   * hotspot はどの種別にも接続できるため、全種別を返す。
   * @param from 始点の付箋種別。
   * @returns 推奨される接続先種別。
   */
  recommendedTargets: (from: StickyType): readonly StickyType[] => {
    if (from === STICKY_TYPES.hotspot) {
      return Object.values(STICKY_TYPES);
    }
    return ALLOWED_PAIRS.filter(([allowedFrom]) => allowedFrom === from).map(
      ([, to]) => to,
    );
  },
};
