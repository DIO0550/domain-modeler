export interface CanvasError {
  readonly code: string;
  readonly message: string;
}

export const CanvasError = {
  create: (code: string, message: string): CanvasError => ({ code, message }),
};
