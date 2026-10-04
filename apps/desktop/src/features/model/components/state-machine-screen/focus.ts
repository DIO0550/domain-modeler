/** インスペクターの置換・削除後も、表示中のグラフからキーボード操作を続けられるようにする。 */
export const focusGraph = (origin: HTMLElement, selected: boolean): void => {
  const screen = origin.closest<HTMLElement>(".state-machine-screen");
  requestAnimationFrame(() => {
    const target = selected ? screen?.querySelector<SVGElement>('[data-selected="true"]') : null;
    (target ?? screen?.querySelector<HTMLSelectElement>(".state-machine-screen__toolbar select"))?.focus();
  });
};
