/** HTMLカードの寸法計測と、フォント・内容変更による寸法更新の境界。 */
export const ElementSize = {
  observe(
    container: HTMLElement,
    onSizes: (
      sizes: ReadonlyMap<string, Readonly<{ width: number; height: number }>>,
    ) => void,
  ): () => void {
    const elements = [
      ...container.querySelectorAll<HTMLElement>("[data-measure-node]"),
    ];
    const report = () => {
      const sizes = new Map(
        elements.map((element) => {
          const { width, height } = element.getBoundingClientRect();

          return [element.dataset.measureNode!, { width, height }] as const;
        }),
      );

      onSizes(sizes);
    };
    const observer = new ResizeObserver(report);

    elements.forEach((element) => observer.observe(element));
    report();

    return () => observer.disconnect();
  },
} as const;
