export type Anchor = "top" | "right" | "bottom" | "left";

export type StickyType =
  | "event"
  | "actor"
  | "command"
  | "policy"
  | "aggregate"
  | "readModel"
  | "externalSystem"
  | "hotspot";

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Sticky {
  id: string;
  type: StickyType;
  text: string;
  position: Point;
  size: Size;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  fromAnchor?: Anchor;
  toAnchor?: Anchor;
  label: string;
  note: string;
}

export interface Document {
  version: string;
  title: string;
  viewport: Viewport;
  stickies: Sticky[];
  connections: Connection[];
}

export interface CanvasError {
  code: string;
  message: string;
}

export type Error = CanvasError;

export type Result<T, E = CanvasError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
