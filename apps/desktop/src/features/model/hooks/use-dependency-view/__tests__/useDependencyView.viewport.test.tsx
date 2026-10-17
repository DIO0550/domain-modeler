import { act } from "react";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { renderDependencyHook } from "./useDependencyView.test-support";

const surfaceSize = { width: 800, height: 500 };

test("初回計測後に全体へフィットし、ズーム後の再計測では倍率を保つ", () => {
  const hook = renderDependencyHook("data A = B\ndata B = string\n", {
    surfaceSize,
  });
  hook.publish();
  act(() => hook.view().zoomBy(2));
  const viewport = hook.view().viewport;
  hook.publish();

  expect(hook.view().viewport).toEqual(viewport);
  hook.unmount();
});

test("関連のみからの全体復帰でパンとズームを復元する", () => {
  const hook = renderDependencyHook(
    "data A = B\ndata B = string\ndata C = int\n",
    { surfaceSize },
  );
  hook.publish();
  act(() => hook.view().zoomBy(2));
  const viewport = hook.view().viewport;
  act(() => hook.view().select(hook.view().diagram.cards[2].id));
  act(() => hook.view().setMode("related"));
  act(() => hook.view().zoomBy(0.5));
  act(() => hook.view().setMode("all"));

  expect(hook.view().viewport).toEqual(viewport);
  hook.unmount();
});

test("関連のみで再配置しても非表示カードを含む全文書を再計測する", () => {
  const hook = renderDependencyHook(
    "data A = B\ndata B = string\ndata C = int\n",
    { surfaceSize },
  );
  hook.publish();
  const cards = hook.view().diagram.cards;
  act(() => hook.view().select(cards[0].id));
  act(() => hook.view().setMode("related"));
  act(() => hook.view().rearrange());
  hook.publish({
    sizes: new Map(cards.map((card) => [card.id, { width: 350, height: 250 }])),
  });

  expect(Option.unwrap(hook.view().layout)).toMatchObject({
    ok: true,
    value: {
      nodes: cards.map((card) => ({ id: card.id, width: 350, height: 250 })),
    },
  });
  expect(hook.view().visibleDiagram.cards).toHaveLength(2);
  expect(hook.view().viewport.zoom).toBeLessThanOrEqual(1);
  hook.unmount();
});
