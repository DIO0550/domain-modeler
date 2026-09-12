import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { expect } from "vitest";
import {
  Declaration,
  ErrorDecl,
  SourceRange,
  type Diagnostic,
  type ParseResult,
} from "@domain-modeler/model-core";
import { PreviewErrorPlaceholder } from "../index";

type RenderedPlaceholder = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

type PlaceholderRenderer = Readonly<{
  render: (decl: ErrorDecl, diagnostics: readonly Diagnostic[]) => HTMLDivElement;
  unmountAll: () => void;
}>;

/**
 * パース結果から先頭のエラー宣言を取り出す。
 * @param parsed パース結果。
 * @returns 先頭のエラー宣言。
 */
export const firstErrorDecl = (parsed: ParseResult): ErrorDecl => {
  const decl = parsed.document.declarations.find(Declaration.isError);
  expect(decl).toEqual(expect.objectContaining({ kind: "error" }));
  return decl ?? ErrorDecl.create(SourceRange.onLine(1, 1, 1));
};

/**
 * テストファイルごとに独立したプレースホルダ描画器を作る。
 * @returns 描画と一括破棄。
 */
export const createPlaceholderRenderer = (): PlaceholderRenderer => {
  const rendered: RenderedPlaceholder[] = [];
  return {
    render: (decl, diagnostics) => {
      const host = document.createElement("div");
      document.body.append(host);
      const root: Root = createRoot(host);
      act(() => {
        root.render(
          <PreviewErrorPlaceholder decl={decl} diagnostics={diagnostics} />,
        );
      });
      rendered.push({
        host,
        unmount: () => {
          act(() => {
            root.unmount();
          });
          host.remove();
        },
      });
      return host;
    },
    unmountAll: () => {
      for (const entry of rendered.splice(0)) {
        entry.unmount();
      }
    },
  };
};
