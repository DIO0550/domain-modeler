import {
  type Size,
  STICKY_TYPES,
  type StickyType,
  type ValueOf,
} from "@domain-modeler/canvas-core";

/** 物理付箋の色系統。具体色はテーマが決める。 */
export const STICKY_COLOR_FAMILIES = {
  orange: "orange",
  blue: "blue",
  yellow: "yellow",
  purple: "purple",
  green: "green",
  pink: "pink",
  red: "red",
} as const;

export type StickyColorFamily = ValueOf<typeof STICKY_COLOR_FAMILIES>;

/** 付箋の見た目の傾き。Hotspot だけ僅かに傾ける。 */
export const STICKY_ROTATIONS = {
  upright: "upright",
  tilted: "tilted",
} as const;

export type StickyRotation = ValueOf<typeof STICKY_ROTATIONS>;

/** キャンバス UI が使う種別ごとの表示名、色系統、標準サイズ、傾き。 */
export type StickyAppearance = Readonly<{
  type: StickyType;
  caption: string;
  colorFamily: StickyColorFamily;
  defaultSize: Size;
  rotation: StickyRotation;
}>;

/**
 * パディングと種別名キャプションが占める高さ。
 * `.sticky__face` 上下 padding 6px + `.sticky__caption` 12px + 下余白 2px。
 * 最小高さ 40 でも本文 1 行(18px)の上に余白が残る値にする。
 */
const STICKY_CHROME_HEIGHT = 20;

/** 本文 1 行の高さ。`.sticky__text` の line-height 18px に合わせる。 */
const STICKY_BODY_LINE_HEIGHT = 18;

/**
 * キャプションとパディングを除いた本文領域の高さを返す。
 *
 * @param size 付箋のサイズ。
 * @returns 本文に使える高さ。
 */
const bodyHeightOf = (size: Size): number =>
  Math.max(0, size.height - STICKY_CHROME_HEIGHT);

const PALETTE_ORDER = [
  STICKY_TYPES.event,
  STICKY_TYPES.command,
  STICKY_TYPES.actor,
  STICKY_TYPES.aggregate,
  STICKY_TYPES.policy,
  STICKY_TYPES.readModel,
  STICKY_TYPES.externalSystem,
  STICKY_TYPES.hotspot,
] as const;

const APPEARANCES: Readonly<Record<StickyType, StickyAppearance>> = {
  event: {
    type: STICKY_TYPES.event,
    caption: "Domain Event",
    colorFamily: STICKY_COLOR_FAMILIES.orange,
    defaultSize: { width: 160, height: 100 },
    rotation: STICKY_ROTATIONS.upright,
  },
  command: {
    type: STICKY_TYPES.command,
    caption: "Command",
    colorFamily: STICKY_COLOR_FAMILIES.blue,
    defaultSize: { width: 160, height: 100 },
    rotation: STICKY_ROTATIONS.upright,
  },
  actor: {
    type: STICKY_TYPES.actor,
    caption: "Actor",
    colorFamily: STICKY_COLOR_FAMILIES.yellow,
    defaultSize: { width: 120, height: 80 },
    rotation: STICKY_ROTATIONS.upright,
  },
  aggregate: {
    type: STICKY_TYPES.aggregate,
    caption: "Aggregate",
    colorFamily: STICKY_COLOR_FAMILIES.yellow,
    defaultSize: { width: 200, height: 140 },
    rotation: STICKY_ROTATIONS.upright,
  },
  policy: {
    type: STICKY_TYPES.policy,
    caption: "Policy",
    colorFamily: STICKY_COLOR_FAMILIES.purple,
    defaultSize: { width: 160, height: 100 },
    rotation: STICKY_ROTATIONS.upright,
  },
  readModel: {
    type: STICKY_TYPES.readModel,
    caption: "Read Model",
    colorFamily: STICKY_COLOR_FAMILIES.green,
    defaultSize: { width: 160, height: 100 },
    rotation: STICKY_ROTATIONS.upright,
  },
  externalSystem: {
    type: STICKY_TYPES.externalSystem,
    caption: "External System",
    colorFamily: STICKY_COLOR_FAMILIES.pink,
    defaultSize: { width: 160, height: 100 },
    rotation: STICKY_ROTATIONS.upright,
  },
  hotspot: {
    type: STICKY_TYPES.hotspot,
    caption: "Hotspot",
    colorFamily: STICKY_COLOR_FAMILIES.red,
    defaultSize: { width: 140, height: 100 },
    rotation: STICKY_ROTATIONS.tilted,
  },
};

/** 付箋種別の表示を扱う関数群。 */
export const StickyAppearance = {
  /**
   * 種別のキャプション、色系統、標準サイズ、傾きを返す。
   *
   * @param type 付箋種別。
   * @returns その種別の表示。
   */
  of(type: StickyType): StickyAppearance {
    return APPEARANCES[type];
  },

  /**
   * パレットに並べる種別表示を canvas-ui の表順で返す。
   *
   * @returns 8種の表示。
   */
  all(): readonly StickyAppearance[] {
    return PALETTE_ORDER.map((type) => APPEARANCES[type]);
  },

  /**
   * 付箋サイズから本文として表示できる行数を返す。
   * キャプションを残したうえで、あふれた行は省略する。
   * 最小高さでも本文 1 行分の高さを確保する。
   *
   * @param size 付箋のサイズ。
   * @returns 本文に割り当てる行数。
   */
  bodyLineCount(size: Size): number {
    return Math.max(
      1,
      Math.floor(bodyHeightOf(size) / STICKY_BODY_LINE_HEIGHT),
    );
  },
} as const;
