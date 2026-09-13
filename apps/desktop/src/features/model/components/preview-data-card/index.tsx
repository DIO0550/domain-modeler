import {
  DATA_CARD_KINDS,
  type DataDecl,
} from "@domain-modeler/model-core";
import {
  DataCardPreview,
  PreviewTypeRef,
} from "../../domains/data-card-preview";
import { DeclName } from "../decl-name";
import "./PreviewDataCard.css";

const EMPTY_TYPE_NAMES: ReadonlySet<string> = new Set();

type PreviewDataCardProps = Readonly<{
  decl: DataDecl;
  undefinedTypeNames?: ReadonlySet<string>;
  onTypeRefClick?: (typeRef: PreviewTypeRef) => void;
  onUndefinedBadgeClick?: (typeRef: PreviewTypeRef) => void;
  onRename?: (nextName: string) => void;
}>;

/**
 * data 宣言を ALIAS / RECORD / CHOICE / VALUE のカードとして表示する。
 *
 * @param props data 宣言、未定義として示す型名、型参照と未定義バッジのクリック、宣言名のリネーム。
 * @returns 構造化プレビューの data カード。
 */
export function PreviewDataCard({
  decl,
  undefinedTypeNames = EMPTY_TYPE_NAMES,
  onTypeRefClick,
  onUndefinedBadgeClick,
  onRename,
}: PreviewDataCardProps) {
  const preview = DataCardPreview.create(decl, undefinedTypeNames);
  return (
    <article
      className="preview-data-card"
      data-card-kind={preview.kind}
      data-decl-name={preview.name}
      aria-label={`${preview.kind}: ${preview.name}`}
    >
      <header className="preview-data-card__header">
        <DeclName
          name={preview.name}
          className="preview-data-card__name"
          onRename={onRename}
        />
        <p className="preview-data-card__kind">{preview.kind}</p>
      </header>
      <div className="preview-data-card__body">
        <DataCardBody
          preview={preview}
          onTypeRefClick={onTypeRefClick}
          onUndefinedBadgeClick={onUndefinedBadgeClick}
        />
      </div>
    </article>
  );
}

type DataCardBodyProps = Readonly<{
  preview: DataCardPreview;
  onTypeRefClick?: (typeRef: PreviewTypeRef) => void;
  onUndefinedBadgeClick?: (typeRef: PreviewTypeRef) => void;
}>;

/**
 * カード種別ごとの本体を描画する。
 *
 * @param props プレビューとクリック。
 * @returns 種別ごとの本体。
 */
function DataCardBody({
  preview,
  onTypeRefClick,
  onUndefinedBadgeClick,
}: DataCardBodyProps) {
  if (preview.kind === DATA_CARD_KINDS.ALIAS) {
    return (
      <TypeRefView
        typeRef={preview.term}
        onTypeRefClick={onTypeRefClick}
        onUndefinedBadgeClick={onUndefinedBadgeClick}
      />
    );
  }
  if (preview.kind === DATA_CARD_KINDS.RECORD) {
    return (
      <ul className="preview-data-card__record">
        {preview.fields.map((field, index) => (
          <li
            key={`${field.term.name}-${index}`}
            className="preview-data-card__record-field"
          >
            <TypeRefView
              typeRef={field}
              onTypeRefClick={onTypeRefClick}
              onUndefinedBadgeClick={onUndefinedBadgeClick}
            />
          </li>
        ))}
      </ul>
    );
  }
  if (preview.kind === DATA_CARD_KINDS.CHOICE) {
    return (
      <ChoiceCases
        cases={preview.cases}
        onTypeRefClick={onTypeRefClick}
        onUndefinedBadgeClick={onUndefinedBadgeClick}
      />
    );
  }
  return <p className="preview-data-card__value">{preview.caption}</p>;
}

type ChoiceCasesProps = Readonly<{
  cases: readonly PreviewTypeRef[];
  onTypeRefClick?: (typeRef: PreviewTypeRef) => void;
  onUndefinedBadgeClick?: (typeRef: PreviewTypeRef) => void;
}>;

/**
 * CHOICE のケースをピルで横並びにし、間に or を挟む。
 *
 * @param props ケースの型参照とクリック。
 * @returns ピルと or の列。
 */
function ChoiceCases({
  cases,
  onTypeRefClick,
  onUndefinedBadgeClick,
}: ChoiceCasesProps) {
  return (
    <div className="preview-data-card__choice">
      {cases.map((typeRef, index) => (
        <ChoiceCase
          key={`${typeRef.term.name}-${index}`}
          typeRef={typeRef}
          leadingSeparator={choiceSeparator(index)}
          onTypeRefClick={onTypeRefClick}
          onUndefinedBadgeClick={onUndefinedBadgeClick}
        />
      ))}
    </div>
  );
}

type ChoiceCaseProps = Readonly<{
  typeRef: PreviewTypeRef;
  leadingSeparator: "none" | "or";
  onTypeRefClick?: (typeRef: PreviewTypeRef) => void;
  onUndefinedBadgeClick?: (typeRef: PreviewTypeRef) => void;
}>;

/**
 * CHOICE の1ケースを、必要なら先行する or 付きで描画する。
 *
 * @param props ケースと先行区切りとクリック。
 * @returns or とピル。
 */
function ChoiceCase({
  typeRef,
  leadingSeparator,
  onTypeRefClick,
  onUndefinedBadgeClick,
}: ChoiceCaseProps) {
  const pill = (
    <span className="preview-data-card__pill">
      <TypeRefView
        typeRef={typeRef}
        onTypeRefClick={onTypeRefClick}
        onUndefinedBadgeClick={onUndefinedBadgeClick}
      />
    </span>
  );
  if (leadingSeparator === "none") {
    return (
      <span className="preview-data-card__choice-item">{pill}</span>
    );
  }
  return (
    <span className="preview-data-card__choice-item">
      <span className="preview-data-card__or">or</span>
      {pill}
    </span>
  );
}

/**
 * CHOICE の何番目のケースかから、先行する or の有無を決める。
 *
 * @param index 0始まりの位置。
 * @returns 先頭は区切りなし、2件目以降は or。
 */
const choiceSeparator = (index: number): ChoiceCaseProps["leadingSeparator"] => {
  if (index === 0) {
    return "none";
  }
  return "or";
};

type TypeRefViewProps = Readonly<{
  typeRef: PreviewTypeRef;
  onTypeRefClick?: (typeRef: PreviewTypeRef) => void;
  onUndefinedBadgeClick?: (typeRef: PreviewTypeRef) => void;
}>;

/**
 * 型参照名、後置修飾、未定義バッジを並べて表示する。
 *
 * @param props プレビュー用の型参照とクリック。
 * @returns 型参照の表示。
 */
function TypeRefView({
  typeRef,
  onTypeRefClick,
  onUndefinedBadgeClick,
}: TypeRefViewProps) {
  return (
    <span className="preview-data-card__type-ref">
      <TypeName typeRef={typeRef} onTypeRefClick={onTypeRefClick} />
      {typeRef.term.modifiers.map((modifier, index) => (
        <span
          key={`${modifier}-${index}`}
          className="preview-data-card__modifier"
        >
          {modifier}
        </span>
      ))}
      <UndefinedBadge
        typeRef={typeRef}
        onUndefinedBadgeClick={onUndefinedBadgeClick}
      />
    </span>
  );
}

type TypeNameProps = Readonly<{
  typeRef: PreviewTypeRef;
  onTypeRefClick?: (typeRef: PreviewTypeRef) => void;
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
      className={`${className} preview-data-card__type-name-button`}
      onClick={() => onTypeRefClick(typeRef)}
    >
      {typeRef.term.name}
    </button>
  );
}

type UndefinedBadgeProps = Readonly<{
  typeRef: PreviewTypeRef;
  onUndefinedBadgeClick?: (typeRef: PreviewTypeRef) => void;
}>;

/**
 * 未定義参照のバッジを出す。クリック通知があるときはスタブ生成のボタンにする。
 *
 * @param props プレビュー用の型参照とバッジのクリック。
 * @returns バッジ。未定義でなければ何も出さない。
 */
function UndefinedBadge({
  typeRef,
  onUndefinedBadgeClick,
}: UndefinedBadgeProps) {
  if (!PreviewTypeRef.isUndefined(typeRef)) {
    return null;
  }
  if (onUndefinedBadgeClick === undefined) {
    return <span className="preview-data-card__undefined-badge">未定義</span>;
  }
  return (
    <button
      type="button"
      className="preview-data-card__undefined-badge preview-data-card__undefined-badge-button"
      aria-label={`未定義の「${typeRef.term.name}」のスタブを生成`}
      onClick={() => onUndefinedBadgeClick(typeRef)}
    >
      未定義
    </button>
  );
}

/**
 * 型名の class を組み立てる。
 *
 * @param typeRef プレビュー用の型参照。
 * @returns 未定義・プリミティブの修飾を含む class。
 */
const typeNameClassName = (typeRef: PreviewTypeRef): string => {
  const undefinedClass = PreviewTypeRef.isUndefined(typeRef)
    ? ["preview-data-card__type-name--undefined"]
    : [];
  const primitiveClass = PreviewTypeRef.isPrimitive(typeRef)
    ? ["preview-data-card__type-name--primitive"]
    : [];
  const classNames = [
    "preview-data-card__type-name",
    ...undefinedClass,
    ...primitiveClass,
  ];
  return classNames.join(" ");
};
