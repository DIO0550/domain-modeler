/** DOM EventTarget に対する汎用の判定。 */
export const EventTargetEx = {
  /**
   * イベントの発生元がテキスト入力か判定する。
   *
   * @param target イベントの発生元。
   * @returns 標準入力、select、contenteditable 内なら true。
   */
  isTextEntry(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof Element &&
        target.closest(
          '[contenteditable]:not([contenteditable="false"]), [role="textbox"]',
        ) !== null)
    );
  },
  /**
   * イベントの発生元が操作可能な要素内か判定する。
   *
   * @param target イベントの発生元。
   * @returns 標準コントロールやカスタム操作要素内なら true。
   */
  isInteractive(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      target.closest(
        'button, input, textarea, select, a[href], summary, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [role="option"], [role="tab"], [role="slider"], [role="spinbutton"], [role="combobox"], [role="textbox"], [contenteditable]:not([contenteditable="false"])',
      ) !== null
    );
  },
} as const;
