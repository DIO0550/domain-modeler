export interface CanvasError {
  readonly code: string;
  readonly message: string;
}

export const CanvasError = {
  /**
   * エラーコードとメッセージからキャンバスエラーを生成する。
   * @param code エラーを識別するコード。
   * @param message エラーの内容を表すメッセージ。
   * @returns 生成したキャンバスエラー。
   */
  create: (code: string, message: string): CanvasError => ({ code, message }),
};
