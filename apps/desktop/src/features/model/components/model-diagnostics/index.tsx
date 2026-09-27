import { useEffect, useEffectEvent, useRef, useState, type KeyboardEvent } from "react";
import {
  Declaration,
  Result,
  type Declaration as DeclarationValue,
  type NamedDecl as NamedDeclValue,
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
import { useModelTextHistory } from "../../hooks/use-model-text-history";
import { ModelEditorDisplay } from "../model-editor";
import { PreviewDataCard } from "../preview-data-card";
import { PreviewErrorPlaceholder } from "../preview-error-placeholder";
import { PreviewWorkflowCard } from "../preview-workflow-card";
import { StateMachine } from "../state-machine-screen";
import "./ModelDiagnostics.css";

type ModelDiagnosticsProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
  isActive?: boolean;
  onHistoryControlsChange?: (controls: Readonly<{ undo?: () => void; redo?: () => void }>) => void;
}>;

/**
 * テキストエディタと構造化プレビューに診断を重ねて表示する。
 * パースエラーは保存を妨げない。
 *
 * @param props 全文と変更通知。
 * @returns 左右分割の診断付きモデル編集画面。
 */
export function ModelDiagnostics({ value, onChange, isActive = true, onHistoryControlsChange }: ModelDiagnosticsProps) {
  const [mode, setMode] = useState<"model" | "state-machine">("model");
  const history = useModelTextHistory({ value, onChange });
  const editing = useTextEditing({ value, onChange: history.change });
  const analyzed = AnalyzedModel.create(editing.value);
  const previewRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const notifyHistoryControlsChange = useEffectEvent(() => {
    onHistoryControlsChange?.({
      undo: history.canUndo ? history.undo : undefined,
      redo: history.canRedo ? history.redo : undefined,
    });
  });
  useEffect(() => {
    if (isActive) {
      notifyHistoryControlsChange();
    }
  }, [isActive, value, history.canUndo, history.canRedo]);

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

  const renameDeclaration = (params: Readonly<{
    decl: NamedDeclValue;
    nextName: string;
  }>) => {
    const renamed = AnalyzedModel.rename(analyzed, params);
    if (Result.isErr(renamed)) {
      return;
    }
    editing.applyEdit(renamed.value.edit, renamed.value.caret);
    scrollPreviewTo(params.nextName);
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

  const onHistoryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.metaKey && !event.ctrlKey) {
      return;
    }
    if (event.altKey) {
      return;
    }
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (event.target instanceof HTMLInputElement) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key !== "z" && key !== "y") {
      return;
    }
    event.preventDefault();
    const restoreFocus = () => {
      if (mode !== "state-machine") {
        return;
      }
      requestAnimationFrame(() => {
        if (document.activeElement !== document.body) {
          return;
        }
        workspaceRef.current?.querySelector<HTMLSelectElement>(".state-machine-screen__toolbar select")?.focus();
      });
    };
    const redoRequested = key === "y" || event.shiftKey;
    if (redoRequested) {
      history.redo();
      restoreFocus();
      return;
    }
    history.undo();
    restoreFocus();
  };

  return (
    <div ref={workspaceRef} className="model-diagnostics-workspace" onKeyDownCapture={onHistoryKeyDown}>
      <nav className="model-diagnostics-workspace__modes" aria-label="表示モード">
        <button type="button" aria-current={mode === "model" ? "page" : undefined} onClick={() => setMode("model")}>モデル</button>
        <button type="button" aria-current={mode === "state-machine" ? "page" : undefined} onClick={() => setMode("state-machine")}>ステートマシン</button>
      </nav>
      {mode === "state-machine" ? <StateMachine.Root value={value} onChange={history.change}
        onEditSource={() => setMode("model")}>
        <StateMachine.Palette />
        <StateMachine.Graph />
        <StateMachine.Inspector />
      </StateMachine.Root> : <div className="model-diagnostics">
      <div className="model-diagnostics__editor-heading">モデル定義</div>
      <div
        className="model-diagnostics__toolbar"
        role="toolbar"
        aria-label="編集支援"
      >
        <span className="model-diagnostics__preview-heading">プレビュー</span>
        <div className="model-diagnostics__actions">
          <button
            type="button"
            className="model-diagnostics__toolbar-button"
            onClick={() => insertTemplate(DeclTemplate.data())}
          >
            ＋ data
          </button>
          <button
            type="button"
            className="model-diagnostics__toolbar-button"
            onClick={() => insertTemplate(DeclTemplate.workflow())}
          >
            ＋ workflow
          </button>
        </div>
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
    </div>}
    </div>
  );
}

type PreviewDeclItemProps = Readonly<{
  decl: DeclarationValue;
  analyzed: AnalyzedModel;
  onTypeRefClick: (typeRef: PreviewTypeRefValue) => void;
  onUndefinedBadgeClick: (typeRef: PreviewTypeRefValue) => void;
  onRename: (params: Readonly<{ decl: NamedDeclValue; nextName: string }>) => void;
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
  if (Declaration.isStateMachine(decl)) {
    return null;
  }
  const handleRename = (nextName: string) => {
    onRename({ decl, nextName });
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
