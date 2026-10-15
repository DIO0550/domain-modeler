/** HTML要素を可視範囲へ移動し、キーボード操作の続行先にする境界。 */
export const ElementNavigation = {
  reveal(element: HTMLElement): void {
    element.scrollIntoView({ block: "nearest", inline: "nearest" });
    element.focus({ preventScroll: true });
  },
} as const;
