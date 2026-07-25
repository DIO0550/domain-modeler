export type StickyType =
  | "event"
  | "actor"
  | "command"
  | "policy"
  | "aggregate"
  | "readModel"
  | "externalSystem"
  | "hotspot";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Sticky {
  readonly id: string;
  readonly type: StickyType;
  readonly text: string;
  readonly position: Point;
  readonly size: Size;
}

export const Sticky = {
  create: (
    id: string,
    type: StickyType,
    text: string,
    position: Point,
    size: Size,
  ): Sticky => ({ id, type, text, position, size }),
};
