import type { Brand } from "./brand";

export type StickyType =
  | "event"
  | "actor"
  | "command"
  | "policy"
  | "aggregate"
  | "readModel"
  | "externalSystem"
  | "hotspot";

export type StickyId = Brand<string, "StickyId">;

export const StickyId = {
  /**
   * 永続化された文字列を付箋IDとして扱う。
   * @param raw 付箋IDとして扱う文字列。
   * @returns 付箋ID。
   */
  create: (raw: string): StickyId => raw as StickyId,
};

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export const Size = {
  /**
   * 付箋のサイズが有効か判定する。
   * @param size 判定するサイズ。
   * @returns 幅と高さがともに正の場合は `true`。
   */
  isValid: (size: Size): boolean => size.width > 0 && size.height > 0,
};

export interface Sticky {
  readonly id: StickyId;
  readonly type: StickyType;
  readonly text: string;
  readonly position: Point;
  readonly size: Size;
}

export const Sticky = {
  /**
   * 指定された内容から付箋を生成する。
   * @param id 付箋ID。
   * @param type 付箋の種別。
   * @param text 付箋の本文。
   * @param position 付箋の位置。
   * @param size 付箋のサイズ。
   * @returns 指定内容で生成した付箋。
   */
  create: (
    id: StickyId,
    type: StickyType,
    text: string,
    position: Point,
    size: Size,
  ): Sticky => ({ id, type, text, position, size }),
};
