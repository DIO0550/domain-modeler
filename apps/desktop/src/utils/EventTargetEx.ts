/** DOM EventTarget に対する汎用の判定。 */
export const EventTargetEx = {
  /**
   * イベントの発生元がテキスト入力か判定する。
   *
   * @param target イベントの発生元。
   * @returns textarea または input なら true。
   */
  isTextEntry(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLInputElement
    );
  },
} as const;
