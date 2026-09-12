import {
  Declaration,
  type Declaration as DeclarationValue,
} from "@domain-modeler/model-core";
import { AnalyzedModel } from "../../domains/analyzed-model";
import { ModelEditor } from "../model-editor";
import { PreviewDataCard } from "../preview-data-card";
import { PreviewErrorPlaceholder } from "../preview-error-placeholder";
import { PreviewWorkflowCard } from "../preview-workflow-card";
import "./ModelDiagnostics.css";

type ModelDiagnosticsProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
}>;

/**
 * テキストエディタと構造化プレビューに診断を重ねて表示する。
 * パースエラーは保存を妨げない。
 *
 * @param props 全文と変更通知。
 * @returns 左右分割の診断付きモデル編集画面。
 */
export function ModelDiagnostics({ value, onChange }: ModelDiagnosticsProps) {
  const analyzed = AnalyzedModel.create(value);
  return (
    <div className="model-diagnostics">
      <section className="model-diagnostics__editor" aria-label="テキストエディタ">
        <ModelEditor value={value} onChange={onChange} />
      </section>
      <section
        className="model-diagnostics__preview"
        aria-label="構造化プレビュー"
      >
        {analyzed.document.declarations.map((decl) => (
          <PreviewDeclItem
            key={declarationKey(decl)}
            decl={decl}
            analyzed={analyzed}
          />
        ))}
      </section>
    </div>
  );
}

type PreviewDeclItemProps = Readonly<{
  decl: DeclarationValue;
  analyzed: AnalyzedModel;
}>;

/**
 * 宣言を data / workflow カード、またはエラープレースホルダとして出す。
 *
 * @param props 宣言と解析結果。
 * @returns プレビュー項目。
 */
function PreviewDeclItem({ decl, analyzed }: PreviewDeclItemProps) {
  if (Declaration.isError(decl)) {
    return (
      <PreviewErrorPlaceholder
        decl={decl}
        diagnostics={analyzed.diagnostics}
      />
    );
  }
  if (Declaration.isData(decl)) {
    return (
      <PreviewDataCard
        decl={decl}
        undefinedTypeNames={analyzed.undefinedTypeNames}
      />
    );
  }
  return (
    <PreviewWorkflowCard
      decl={decl}
      undefinedTypeNames={analyzed.undefinedTypeNames}
    />
  );
}

/**
 * 宣言の出現位置から一覧の key を作る。
 *
 * @param decl 文書内の宣言。
 * @returns 位置に基づく key。
 */
const declarationKey = (decl: DeclarationValue): string =>
  `${decl.kind}-${decl.range.startLine}-${decl.range.startColumn}-${decl.range.endLine}-${decl.range.endColumn}`;
