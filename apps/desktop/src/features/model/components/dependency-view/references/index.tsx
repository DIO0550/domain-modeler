import type { DependencyInspection } from "../../../domains/dependency-inspection";
import { DependencyCard } from "../../../domains/dependency-card";
import { Option } from "@/utils/Option";
import { useDependencyContext } from "../context";

/**
 * 接続先ごとの選択ボタンと、役割別の各参照箇所への移動を表示する。
 * @param props 両方向の見出しと、接続先ごとにまとめた参照。
 * @returns キーボードでも操作できる参照一覧。
 */
export function DependencyReferences({
  title,
  relations,
}: Readonly<{
  title: "依存先" | "参照元";
  relations: DependencyInspection["dependencies"];
}>) {
  const context = useDependencyContext();

  if (Option.isNone(context)) {
    return null;
  }

  const { view, onEditSource } = context.value;

  return (
    <section aria-label={title}>
      <h3>{title}</h3>
      {relations.length === 0 ? (
        <p>なし</p>
      ) : (
        <ul className="dependency-view__references">
          {relations.map(({ node, references }) => (
            <li key={node.id}>
              <button type="button" onClick={() => view.reveal(node.id)}>
                {node.label}
              </button>
              <ul>
                {references.map((reference) => (
                  <li key={reference.id}>
                    <button
                      type="button"
                      onClick={() => onEditSource(reference.nameRange)}
                    >
                      {DependencyCard.roleLabel(reference.role)}・
                      {DependencyCard.termText(reference.term)}・行{" "}
                      {reference.nameRange.startLine}:
                      {reference.nameRange.startColumn}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
