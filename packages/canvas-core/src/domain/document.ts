import { Viewport } from "./viewport";
import type { Point, Size, Sticky, StickyType } from "./sticky";
import type { Connection } from "./connection";

export interface Document {
  readonly version: string;
  readonly title: string;
  readonly viewport: Viewport;
  readonly stickies: readonly Sticky[];
  readonly connections: readonly Connection[];
}

export const DEFAULT_TITLE = "Untitled";

const STICKY_ID_PREFIX = "stk_";
const STICKY_RANDOM_PART_LENGTH = 12;

const createStickyId = (): string =>
  `${STICKY_ID_PREFIX}${crypto.randomUUID().replace(/-/g, "").slice(0, STICKY_RANDOM_PART_LENGTH)}`;

const isValidSize = (size: Size): boolean =>
  size.width > 0 && size.height > 0;

export const Document = {
  empty: (title: string = DEFAULT_TITLE): Document => ({
    version: "1.0",
    title,
    viewport: Viewport.default(),
    stickies: [],
    connections: [],
  }),
  addSticky: (
    doc: Document,
    type: StickyType,
    text: string,
    position: Point,
    size: Size,
  ): Document => {
    if (!isValidSize(size)) {
      throw new RangeError("Sticky size must be positive");
    }

    const sticky: Sticky = {
      id: createStickyId(),
      type,
      text,
      position,
      size,
    };

    return {
      ...doc,
      stickies: [...doc.stickies, sticky],
    };
  },
  updateStickyText: (doc: Document, stickyId: string, text: string): Document => ({
    ...doc,
    stickies: doc.stickies.map((sticky) =>
      sticky.id === stickyId ? { ...sticky, text } : sticky,
    ),
  }),
  moveSticky: (doc: Document, stickyId: string, position: Point): Document => ({
    ...doc,
    stickies: doc.stickies.map((sticky) =>
      sticky.id === stickyId ? { ...sticky, position } : sticky,
    ),
  }),
  resizeSticky: (doc: Document, stickyId: string, size: Size): Document => {
    if (!isValidSize(size)) {
      throw new RangeError("Sticky size must be positive");
    }

    return {
      ...doc,
      stickies: doc.stickies.map((sticky) =>
        sticky.id === stickyId ? { ...sticky, size } : sticky,
      ),
    };
  },
  changeStickyType: (
    doc: Document,
    stickyId: string,
    type: StickyType,
  ): Document => ({
    ...doc,
    stickies: doc.stickies.map((sticky) =>
      sticky.id === stickyId ? { ...sticky, type } : sticky,
    ),
  }),
  bringStickyToFront: (doc: Document, stickyId: string): Document => {
    const index = doc.stickies.findIndex((sticky) => sticky.id === stickyId);
    if (index < 0 || index === doc.stickies.length - 1) {
      return doc;
    }

    const sticky = doc.stickies[index];
    return {
      ...doc,
      stickies: [
        ...doc.stickies.slice(0, index),
        ...doc.stickies.slice(index + 1),
        sticky,
      ],
    };
  },
  removeSticky: (doc: Document, stickyId: string): Document => ({
    ...doc,
    stickies: doc.stickies.filter((sticky) => sticky.id !== stickyId),
    connections: doc.connections.filter(
      (connection) => connection.from !== stickyId && connection.to !== stickyId,
    ),
  }),
};
