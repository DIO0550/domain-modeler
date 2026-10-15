import { Result } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import { DependencyCardBody } from "../card";
import { useDependencyContext } from "../context";
import { DependencyEdges } from "../edges";

/**
 * 寸法を計測し、配置済みのカードと矢印、空・異常状態を表示する。
 * @returns スクロールして全カードを読める図。
 */
export function DependencyGraph() {
  const context = useDependencyContext();

  if (Option.isNone(context)) {
    return null;
  }

  const { view } = context.value;
  const { diagram } = view;

  return (
    <section
      className="dependency-view__canvas"
      aria-label="モデル依存図"
      onClick={view.clearSelection}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) {
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          view.clearSelection();
        }
      }}
    >
      <div
        ref={view.measureRef}
        className="dependency-view__measure"
        aria-hidden="true"
        inert
      >
        {diagram.cards.map((card) => (
          <div
            className="dependency-view__card"
            data-measure-node={card.id}
            data-kind={card.kind}
            key={card.id}
          >
            <DependencyCardBody card={card} />
          </div>
        ))}
      </div>
      <DependencyDrawing />
    </section>
  );
}

function DependencyDrawing() {
  const context = useDependencyContext();

  if (Option.isNone(context)) {
    return null;
  }

  const { view, onEditSource } = context.value;
  const { diagram, layout, selected } = view;

  if (diagram.cards.length === 0) {
    return (
      <div className="dependency-view__message" role="status">
        <p>表示できるdata・workflowがありません</p>
        <button type="button" onClick={() => onEditSource()}>
          定義画面へ戻る
        </button>
      </div>
    );
  }

  if (Option.isNone(layout)) {
    return <p role="status">カードを計測しています…</p>;
  }

  if (Result.isErr(layout.value)) {
    return (
      <div className="dependency-view__message" role="alert">
        <p>依存図を配置できませんでした</p>
        <p>{layout.value.error}</p>
        <button type="button" onClick={view.retry}>
          再試行
        </button>
        <button type="button" onClick={() => onEditSource()}>
          定義画面へ戻る
        </button>
      </div>
    );
  }

  const placed = layout.value.value;

  return (
    <div
      className="dependency-view__drawing"
      style={{ width: placed.width, height: placed.height }}
      onClick={view.clearSelection}
    >
      <DependencyEdges
        graph={diagram.graph}
        layout={placed}
        neighborhood={view.neighborhood}
      />
      {diagram.cards.map((card, index) => {
        const position = placed.nodes[index];

        return (
          <div
            ref={(element) => {
              if (element === null) {
                view.nodeElements.current.delete(card.id);

                return;
              }

              view.nodeElements.current.set(card.id, element);
            }}
            role="button"
            tabIndex={0}
            key={card.id}
            className="dependency-view__card dependency-view__node"
            aria-label={`${card.name} ${card.kind}`}
            aria-pressed={
              Option.isSome(selected) && selected.value.id === card.id
            }
            data-node-id={card.id}
            data-kind={card.kind}
            data-related={
              Option.isSome(view.neighborhood) &&
              view.neighborhood.value.nodes.some((node) => node.id === card.id)
            }
            style={{
              left: position.x,
              top: position.y,
              width: position.width,
              minHeight: position.height,
            }}
            onClick={(event) => {
              event.stopPropagation();
              view.select(card.id);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) {
                return;
              }

              if (event.key !== "Enter" && event.key !== " ") {
                return;
              }

              event.preventDefault();
              view.select(card.id);
            }}
          >
            <DependencyCardBody card={card} />
          </div>
        );
      })}
    </div>
  );
}
