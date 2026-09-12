import { Fragment } from "react";
import {
  DATA_CARD_KINDS,
  type DataDecl,
} from "@domain-modeler/model-core";
import {
  DataCardPreview,
  PreviewTypeRef,
} from "../../domains/data-card-preview";
import "./PreviewDataCard.css";

const EMPTY_TYPE_NAMES: ReadonlySet<string> = new Set();

type PreviewDataCardProps = Readonly<{
  decl: DataDecl;
  undefinedTypeNames?: ReadonlySet<string>;
}>;

/**
 * data 宣言を ALIAS / RECORD / CHOICE / VALUE のカードとして表示する。
 *
 * @param props data 宣言と、未定義として示す型名。
 * @returns 構造化プレビューの data カード。
 */
export function PreviewDataCard({
  decl,
  undefinedTypeNames = EMPTY_TYPE_NAMES,
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
        <h2 className="preview-data-card__name">{preview.name}</h2>
        <p className="preview-data-card__kind">{preview.kind}</p>
      </header>
      <div className="preview-data-card__body">
        <DataCardBody preview={preview} />
      </div>
    </article>
  );
}

type DataCardBodyProps = Readonly<{
  preview: DataCardPreview;
}>;

/**
 * カード種別ごとの本体を描画する。
 *
 * @param props プレビュー。
 * @returns 種別ごとの本体。
 */
function DataCardBody({ preview }: DataCardBodyProps) {
  if (preview.kind === DATA_CARD_KINDS.ALIAS) {
    return <TypeRefView typeRef={preview.term} />;
  }
  if (preview.kind === DATA_CARD_KINDS.RECORD) {
    return (
      <ul className="preview-data-card__record">
        {preview.fields.map((field, index) => (
          <li
            key={`${field.term.name}-${index}`}
            className="preview-data-card__record-field"
          >
            <TypeRefView typeRef={field} />
          </li>
        ))}
      </ul>
    );
  }
  if (preview.kind === DATA_CARD_KINDS.CHOICE) {
    return <ChoiceCases cases={preview.cases} />;
  }
  return <p className="preview-data-card__value">{preview.caption}</p>;
}

type ChoiceCasesProps = Readonly<{
  cases: readonly PreviewTypeRef[];
}>;

/**
 * CHOICE のケースをピルで横並びにし、間に or を挟む。
 *
 * @param props ケースの型参照。
 * @returns ピルと or の列。
 */
function ChoiceCases({ cases }: ChoiceCasesProps) {
  return (
    <div className="preview-data-card__choice">
      {cases.map((typeRef, index) => (
        <ChoiceCase
          key={`${typeRef.term.name}-${index}`}
          typeRef={typeRef}
          leadingSeparator={choiceSeparator(index)}
        />
      ))}
    </div>
  );
}

type ChoiceCaseProps = Readonly<{
  typeRef: PreviewTypeRef;
  leadingSeparator: "none" | "or";
}>;

/**
 * CHOICE の1ケースを、必要なら先行する or 付きで描画する。
 *
 * @param props ケースと先行区切り。
 * @returns or とピル。
 */
function ChoiceCase({ typeRef, leadingSeparator }: ChoiceCaseProps) {
  const pill = (
    <span className="preview-data-card__pill">
      <TypeRefView typeRef={typeRef} />
    </span>
  );
  if (leadingSeparator === "none") {
    return pill;
  }
  return (
    <Fragment>
      <span className="preview-data-card__or">or</span>
      {pill}
    </Fragment>
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
}>;

/**
 * 型参照名、後置修飾、未定義バッジを並べて表示する。
 *
 * @param props プレビュー用の型参照。
 * @returns 型参照の表示。
 */
function TypeRefView({ typeRef }: TypeRefViewProps) {
  const badge = PreviewTypeRef.isUndefined(typeRef) ? (
    <span className="preview-data-card__undefined-badge">未定義</span>
  ) : null;
  return (
    <span className="preview-data-card__type-ref">
      <span className={typeNameClassName(typeRef)}>{typeRef.term.name}</span>
      {typeRef.term.modifiers.map((modifier) => (
        <span key={modifier} className="preview-data-card__modifier">
          {modifier}
        </span>
      ))}
      {badge}
    </span>
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
