import type { Diagnostic, ErrorDecl } from "@domain-modeler/model-core";
import {
  PreviewErrorPlaceholder as PreviewErrorPlaceholderModel,
} from "../../domains/preview-error-placeholder";
import "./PreviewErrorPlaceholder.css";

type PreviewErrorPlaceholderProps = Readonly<{
  decl: ErrorDecl;
  diagnostics: readonly Diagnostic[];
}>;

/**
 * パースできなかった宣言の代わりに、行番号とエラーメッセージを表示する。
 *
 * @param props エラー宣言と、同じソースの診断。
 * @returns プレビュー上のエラープレースホルダ。
 */
export function PreviewErrorPlaceholder({
  decl,
  diagnostics,
}: PreviewErrorPlaceholderProps) {
  const placeholder = PreviewErrorPlaceholderModel.create(decl, diagnostics);
  return (
    <article
      className="preview-error-placeholder"
      data-preview-kind="error"
      aria-label={`${placeholder.startLine}行目のエラー`}
    >
      <p className="preview-error-placeholder__line">
        {placeholder.startLine}行目
      </p>
      <ErrorMessages messages={placeholder.messages} />
    </article>
  );
}

type ErrorMessagesProps = Readonly<{
  messages: readonly string[];
}>;

/**
 * プレースホルダに載せるエラーメッセージを並べる。
 *
 * @param props メッセージ。
 * @returns メッセージの列。無ければ何も出さない。
 */
function ErrorMessages({ messages }: ErrorMessagesProps) {
  if (messages.length === 0) {
    return null;
  }
  return (
    <div className="preview-error-placeholder__messages">
      {messages.map((message) => (
        <p key={message} className="preview-error-placeholder__message">
          {message}
        </p>
      ))}
    </div>
  );
}
