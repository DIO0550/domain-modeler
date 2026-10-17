type Point = Readonly<{ x: number; y: number }>;

/** HTMLで描画する図の寸法・ポインター捕捉・wheel購読の境界。 */
export const DiagramSurface = {
  observe(
    element: HTMLElement,
    report: (size: Readonly<{ width: number; height: number }>) => void,
  ): () => void {
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();

      if (width > 0 && height > 0) {
        report({ width, height });
      }
    };
    const observer = new ResizeObserver(measure);

    observer.observe(element);
    measure();

    return () => observer.disconnect();
  },

  point(element: HTMLElement, client: Point): Point {
    const rect = element.getBoundingClientRect();

    return { x: client.x - rect.left, y: client.y - rect.top };
  },

  listenWheel(
    element: HTMLElement,
    listener: (event: WheelEvent) => void,
  ): () => void {
    element.addEventListener("wheel", listener, { passive: false });

    return () => element.removeEventListener("wheel", listener);
  },

  capture(element: HTMLElement, pointerId: number): void {
    element.setPointerCapture?.(pointerId);
  },

  release(element: HTMLElement, pointerId: number): void {
    if (element.hasPointerCapture?.(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  },

  focus(element: HTMLElement): void {
    element.focus({ preventScroll: true });
  },
} as const;
