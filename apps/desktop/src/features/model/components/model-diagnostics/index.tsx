import { useRef } from "react";
import {
  Declaration,
  Result,
  type Declaration as DeclarationValue,
} from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../domains/analyzed-model";
import { DeclTemplate, type DeclTemplate as DeclTemplateValue } from "../../domains/decl-template";
import {
  PreviewTypeRef,
  type PreviewTypeRef as PreviewTypeRefValue,
} from "../../domains/preview-type-ref";
import { StubInsertion } from "../../domains/stub-insertion";
import { useTextEditing } from "../../hooks/use-text-editing";
import { ModelEditorDisplay } from "../model-editor";
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
  const editing = useTextEditing({ value, onChange });
  const analyzed = AnalyzedModel.create(editing.value);
  const previewRef = useRef<HTMLElement>(null);

  const scrollPreviewTo = (name: string) => {
    const scroll = () => {
      previewRef.current
        ?.querySelector(`[data-decl-name="${CSS.escape(name)}"]`)
        ?.scrollIntoView({ block: "nearest" });
    };
    scroll();
    requestAnimationFrame(scroll);
  };

  const jumpToDefinition = (name: string) => {
    const caret = AnalyzedModel.caretOfDefinition(analyzed, name);
    if (Option.isNone(caret)) {
      return;
    }
    editing.moveCaret(caret.value);
    scrollPreviewTo(name);
  };

  const insertStub = (name: string) => {
    const insertion = StubInsertion.atDocumentEnd({
      source: editing.value,
      name,
    });
    if (Result.isErr(insertion)) {
      return;
    }
    editing.applyEdit(insertion.value.edit, insertion.value.caret);
    scrollPreviewTo(name);
  };

  const handleTypeRefClick = (typeRef: PreviewTypeRefValue) => {
    if (PreviewTypeRef.isDefined(typeRef)) {
      jumpToDefinition(typeRef.term.name);
      return;
    }
    insertStub(typeRef.term.name);
  };

  const handleUndefinedBadgeClick = (typeRef: PreviewTypeRefValue) => {
    insertStub(typeRef.term.name);
  };

  const renameDeclaration = (names: Readonly<{
    currentName: string;
    nextName: string;
  }>) => {
    const renamed = AnalyzedModel.rename(analyzed, names);
    if (Result.isErr(renamed)) {
      return;
    }
    editing.applyEdit(renamed.value.edit, renamed.value.caret);
    scrollPreviewTo(names.nextName);
  };

  const insertTemplate = (template: DeclTemplateValue) => {
    const input = editing.inputRef.current;
    if (input === null) {
      return;
    }
    const insertion = DeclTemplate.insert(template, {
      source: editing.value,
      start: input.selectionStart,
      end: input.selectionEnd,
    });
    editing.applyEditSelecting(insertion.edit, {
      start: insertion.nameStart,
      end: insertion.nameEnd,
      line: insertion.line,
    });
  };

  return (
    <div className="model-diagnostics">
      <div
        className="model-diagnostics__toolbar"
        role="toolbar"
        aria-label="編集支援"
      >
        <button
          type="button"
          className="model-diagnostics__toolbar-button"
          onClick={() => insertTemplate(DeclTemplate.data())}
        >
          data雛形
        </button>
        <button
          type="button"
          className="model-diagnostics__toolbar-button"
          onClick={() => insertTemplate(DeclTemplate.workflow())}
        >
          workflow雛形
        </button>
      </div>
      <section className="model-diagnostics__editor" aria-label="テキストエディタ">
        <ModelEditorDisplay editing={editing} />
      </section>
      <section
        ref={previewRef}
        className="model-diagnostics__preview"
        aria-label="構造化プレビュー"
      >
        {analyzed.document.declarations.map((decl) => (
          <PreviewDeclItem
            key={declarationKey(decl)}
            decl={decl}
            analyzed={analyzed}
            onTypeRefClick={handleTypeRefClick}
            onUndefinedBadgeClick={handleUndefinedBadgeClick}
            onRename={renameDeclaration}
          />
        ))}
      </section>
    </div>
  );
}

type PreviewDeclItemProps = Readonly<{
  decl: DeclarationValue;
  analyzed: AnalyzedModel;
  onTypeRefClick: (typeRef: PreviewTypeRefValue) => void;
  onUndefinedBadgeClick: (typeRef: PreviewTypeRefValue) => void;
  onRename: (names: Readonly<{ currentName: string; nextName: string }>) => void;
}>;

/**
 * 宣言を data / workflow カード、またはエラープレースホルダとして出す。
 *
 * @param props 宣言と解析結果とプレビュー操作。
 * @returns プレビュー項目。
 */
function PreviewDeclItem({
  decl,
  analyzed,
  onTypeRefClick,
  onUndefinedBadgeClick,
  onRename,
}: PreviewDeclItemProps) {
  if (Declaration.isError(decl)) {
    return (
      <PreviewErrorPlaceholder
        decl={decl}
        diagnostics={analyzed.diagnostics}
      />
    );
  }
  const handleRename = (nextName: string) => {
    onRename({ currentName: decl.name, nextName });
  };
  if (Declaration.isData(decl)) {
    return (
      <PreviewDataCard
        decl={decl}
        undefinedTypeNames={analyzed.undefinedTypeNames}
        onTypeRefClick={onTypeRefClick}
        onUndefinedBadgeClick={onUndefinedBadgeClick}
        onRename={handleRename}
      />
    );
  }
  return (
    <PreviewWorkflowCard
      decl={decl}
      undefinedTypeNames={analyzed.undefinedTypeNames}
      onTypeRefClick={onTypeRefClick}
      onUndefinedBadgeClick={onUndefinedBadgeClick}
      onRename={handleRename}
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
