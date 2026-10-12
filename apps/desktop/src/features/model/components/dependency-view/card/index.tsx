import type { DependencyCard } from "../../../domains/dependency-card";

/**
 * カードの分類と全行を、折り返して読み取れる文字で表示する。
 * @param props グラフから導出したカード。
 * @returns 種類・名前・構成・制約またはworkflowの役割。
 */
export function DependencyCardBody({
  card,
}: Readonly<{ card: DependencyCard }>) {
  return (
    <>
      <span className="dependency-view__kind">{card.kind}</span>
      <strong className="dependency-view__name">{card.name}</strong>
      <dl className="dependency-view__rows">
        {card.rows.map((row, index) => (
          <div key={`${row.label}:${index}`}>
            <dt>{row.label}</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
