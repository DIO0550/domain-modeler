import { Viewport } from "./viewport";
import type { Sticky } from "./sticky";
import type { Connection } from "./connection";

export interface Document {
  readonly version: string;
  readonly title: string;
  readonly viewport: Viewport;
  readonly stickies: readonly Sticky[];
  readonly connections: readonly Connection[];
}

export const Document = {
  empty: (title: string): Document => ({
    version: "1.0",
    title,
    viewport: Viewport.default(),
    stickies: [],
    connections: [],
  }),
};
