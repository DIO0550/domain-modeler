import type { ModelGraphReference } from "../reference";

/** 始点・終点だけで集約した描画用の辺。参照は出現ごとに保持する。 */
export type ModelGraphEdge = Readonly<{
  id: string;
  from: string;
  to: string;
  references: readonly ModelGraphReference[];
}>;

/** 対象外・プリミティブを除いて、参照を描画用の辺へ集約する。 */
export const ModelGraphEdge = {
  collect(
    references: readonly ModelGraphReference[],
  ): readonly ModelGraphEdge[] {
    // この呼び出しで作る集約表のみを更新する。入力と出力の参照は変更しない。
    const edges = new Map<string, ModelGraphEdge>();

    for (const reference of references) {
      const resolution = reference.resolution;

      if (resolution.kind === "primitive") {
        continue;
      }

      if (resolution.kind === "outside") {
        continue;
      }

      const id = JSON.stringify([reference.from, resolution.to]);
      const previous = edges.get(id);

      edges.set(id, {
        id,
        from: reference.from,
        to: resolution.to,
        references: [...(previous?.references ?? []), reference],
      });
    }

    return [...edges.values()];
  },
} as const;
