import type { WorkflowDecl } from "@domain-modeler/model-core";
import {
  PreviewTypeRef,
  type PreviewTypeRef as PreviewTypeRefValue,
} from "../../domains/preview-type-ref";
import {
  WorkflowCardPreview,
  type WorkflowCardSection,
} from "../../domains/workflow-card-preview";
import "./PreviewWorkflowCard.css";

const EMPTY_TYPE_NAMES: ReadonlySet<string> = new Set();

type PreviewWorkflowCardProps = Readonly<{
  decl: WorkflowDecl;
  undefinedTypeNames?: ReadonlySet<string>;
  onTypeRefClick?: (typeRef: PreviewTypeRefValue) => void;
}>;

/**
 * workflow 宣言を IN / OUT / ERR のカードとして表示する。
 * error 節が無いときは ERR 行を出さない。
 *
 * @param props workflow 宣言、未定義として示す型名、型参照のクリック。
 * @returns 構造化プレビューの workflow カード。
 */
export function PreviewWorkflowCard({
  decl,
  undefinedTypeNames = EMPTY_TYPE_NAMES,
  onTypeRefClick,
}: PreviewWorkflowCardProps) {
  const preview = WorkflowCardPreview.create(decl, undefinedTypeNames);
  return (
    <article
      className="preview-workflow-card"
      data-card-kind={preview.kind}
      data-decl-name={preview.name}
      aria-label={`${preview.kind}: ${preview.name}`}
    >
      <header className="preview-workflow-card__header">
        <h2 className="preview-workflow-card__name">{preview.name}</h2>
        <p className="preview-workflow-card__kind">{preview.kind}</p>
      </header>
      <div className="preview-workflow-card__body">
        {preview.sections.map((section) => (
          <WorkflowSectionRow
            key={section.kind}
            section={section}
            onTypeRefClick={onTypeRefClick}
          />
        ))}
      </div>
    </article>
  );
}

type WorkflowSectionRowProps = Readonly<{
  section: WorkflowCardSection;
  onTypeRefClick?: (typeRef: PreviewTypeRefValue) => void;
}>;

/**
 * IN / OUT / ERR の1行を、ラベル列と型参照列で描画する。
 *
 * @param props 節と型参照クリック。
 * @returns 節の行。
 */
function WorkflowSectionRow({
  section,
  onTypeRefClick,
}: WorkflowSectionRowProps) {
  return (
    <div
      className="preview-workflow-card__section"
      data-section={section.kind}
    >
      <div className="preview-workflow-card__section-label">
        <SectionIcon kind={section.kind} />
        <span>{section.label}</span>
      </div>
      <div className="preview-workflow-card__terms">
        {section.terms.map((typeRef, index) => (
          <WorkflowTerm
            key={`${typeRef.term.name}-${index}`}
            typeRef={typeRef}
            leadingSeparator={termSeparator(section.separator, index)}
            onTypeRefClick={onTypeRefClick}
          />
        ))}
      </div>
    </div>
  );
}

type WorkflowTermProps = Readonly<{
  typeRef: PreviewTypeRefValue;
  leadingSeparator: "+" | "or" | "none";
  onTypeRefClick?: (typeRef: PreviewTypeRefValue) => void;
}>;

/**
 * 型参照を、必要なら先行する区切り付きで描画する。
 *
 * @param props 型参照と先行区切り。
 * @returns 区切りと型参照。
 */
function WorkflowTerm({
  typeRef,
  leadingSeparator,
  onTypeRefClick,
}: WorkflowTermProps) {
  const typeRefView = (
    <TypeRefView typeRef={typeRef} onTypeRefClick={onTypeRefClick} />
  );
  if (leadingSeparator === "none") {
    return (
      <span className="preview-workflow-card__term">{typeRefView}</span>
    );
  }
  return (
    <span className="preview-workflow-card__term">
      <span className="preview-workflow-card__separator" aria-hidden="true">
        {leadingSeparator}
      </span>
      {typeRefView}
    </span>
  );
}

type TypeRefViewProps = Readonly<{
  typeRef: PreviewTypeRefValue;
  onTypeRefClick?: (typeRef: PreviewTypeRefValue) => void;
}>;

/**
 * 型参照名、後置修飾、未定義バッジを並べて表示する。
 * 名前付き参照は、クリック通知があるときだけボタンにする。
 *
 * @param props プレビュー用の型参照とクリック。
 * @returns 型参照の表示。
 */
function TypeRefView({ typeRef, onTypeRefClick }: TypeRefViewProps) {
  const badge = PreviewTypeRef.isUndefined(typeRef) ? (
    <span className="preview-workflow-card__undefined-badge">未定義</span>
  ) : null;
  return (
    <span className="preview-workflow-card__type-ref">
      <TypeName typeRef={typeRef} onTypeRefClick={onTypeRefClick} />
      {typeRef.term.modifiers.map((modifier, index) => (
        <span
          key={`${modifier}-${index}`}
          className="preview-workflow-card__modifier"
        >
          {modifier}
        </span>
      ))}
      {badge}
    </span>
  );
}

type TypeNameProps = Readonly<{
  typeRef: PreviewTypeRefValue;
  onTypeRefClick?: (typeRef: PreviewTypeRefValue) => void;
}>;

/**
 * プリミティブ、またはクリック通知が無い名前付き参照はテキストにする。
 * 通知がある名前付き参照だけをボタンにする。
 *
 * @param props プレビュー用の型参照とクリック。
 * @returns 型名。
 */
function TypeName({ typeRef, onTypeRefClick }: TypeNameProps) {
  const className = typeNameClassName(typeRef);
  const isButton =
    onTypeRefClick !== undefined && !PreviewTypeRef.isPrimitive(typeRef);
  if (!isButton) {
    return <span className={className}>{typeRef.term.name}</span>;
  }
  return (
    <button
      type="button"
      className={`${className} preview-workflow-card__type-name-button`}
      onClick={() => onTypeRefClick(typeRef)}
    >
      {typeRef.term.name}
    </button>
  );
}

type SectionIconProps = Readonly<{
  kind: WorkflowCardSection["kind"];
}>;

/**
 * 節の種類を表すアイコン。
 *
 * @param props 節の種類。
 * @returns 装飾用アイコン。
 */
function SectionIcon({ kind }: SectionIconProps) {
  if (kind === "input") {
    return (
      <svg
        className="preview-workflow-card__section-icon"
        viewBox="0 0 16 16"
        width="12"
        height="12"
        aria-hidden="true"
      >
        <path
          d="M8 3v8M4.5 8 8 11.5 11.5 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "output") {
    return (
      <svg
        className="preview-workflow-card__section-icon"
        viewBox="0 0 16 16"
        width="12"
        height="12"
        aria-hidden="true"
      >
        <path
          d="M8 13V5M4.5 8 8 4.5 11.5 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      className="preview-workflow-card__section-icon"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
    >
      <path d="M8 1.5 14.5 13h-13L8 1.5Z" fill="currentColor" />
    </svg>
  );
}

/**
 * 何番目の型参照かから、先行する区切りの有無を決める。
 *
 * @param separator 節の区切り記号。
 * @param index 0始まりの位置。
 * @returns 先頭は区切りなし、2件目以降は節の区切り。
 */
const termSeparator = (
  separator: WorkflowCardSection["separator"],
  index: number,
): WorkflowTermProps["leadingSeparator"] => {
  if (index === 0) {
    return "none";
  }
  return separator;
};

/**
 * 型名の class を組み立てる。
 *
 * @param typeRef プレビュー用の型参照。
 * @returns 未定義・プリミティブの修飾を含む class。
 */
const typeNameClassName = (typeRef: PreviewTypeRefValue): string => {
  const undefinedClass = PreviewTypeRef.isUndefined(typeRef)
    ? ["preview-workflow-card__type-name--undefined"]
    : [];
  const primitiveClass = PreviewTypeRef.isPrimitive(typeRef)
    ? ["preview-workflow-card__type-name--primitive"]
    : [];
  const classNames = [
    "preview-workflow-card__type-name",
    ...undefinedClass,
    ...primitiveClass,
  ];
  return classNames.join(" ");
};
