import { vi } from "vitest";

/** DOMの計測値とResizeObserverだけを制御し、実物の購読処理を検証する。 */
export function createSizeEnvironment() {
  const subscriptions = new Set<{
    elements: Set<Element>;
    report: () => void;
  }>();

  vi.stubGlobal("ResizeObserver", function (report: () => void) {
    const subscription = { elements: new Set<Element>(), report };

    subscriptions.add(subscription);

    return {
      observe: (element: Element) => subscription.elements.add(element),
      disconnect: () => subscriptions.delete(subscription),
    };
  });

  const container = document.createElement("div");

  return {
    container,
    add: (
      params: Readonly<{
        id: string;
        width: number;
        height: number;
        measured?: boolean;
      }>,
    ) => {
      const element = document.createElement("div");
      const dimensions = { width: params.width, height: params.height };

      if (params.measured !== false) {
        element.dataset.measureNode = params.id;
      }

      element.getBoundingClientRect = () => DOMRect.fromRect(dimensions);
      container.append(element);

      return {
        resize: (next: Readonly<{ width: number; height: number }>) => {
          Object.assign(dimensions, next);
          subscriptions.forEach((subscription) => {
            if (subscription.elements.has(element)) {
              subscription.report();
            }
          });
        },
      };
    },
  };
}
