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
  create: (
    id: StickyId,
    type: StickyType,
    text: string,
    position: Point,
    size: Size,
  ): Sticky => ({ id, type, text, position, size }),
};
