export interface Viewport {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 4.0;

export const Viewport = {
  default: (): Viewport => ({ x: 0, y: 0, zoom: 1 }),
  clampZoom: (zoom: number): number =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)),
};
