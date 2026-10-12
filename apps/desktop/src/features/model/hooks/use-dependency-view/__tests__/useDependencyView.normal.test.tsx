import { act } from "react";
import { expect, test } from "vitest";
import { Result } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import { renderDependencyHook } from "./useDependencyView.test-support";

test("計測完了までは配置を出さず、完了後は全カードを実寸で配置する", () => {
  const hook = renderDependencyHook("data 注文 = 商品\ndata 商品 = string\n");

  expect(hook.view().layout).toEqual(Option.none());

  hook.publish();

  expect(Option.unwrap(hook.view().layout)).toMatchObject({
    ok: true,
    value: {
      nodes: [
        { width: 280, height: 120 },
        { width: 280, height: 120 },
      ],
      edges: [
        {
          from: hook.view().diagram.cards[0].id,
          to: hook.view().diagram.cards[1].id,
        },
      ],
    },
  });
  hook.unmount();
});

test("選択と選択解除を現在のカードへ反映する", () => {
  const hook = renderDependencyHook("data 注文 = string\n");
  const card = hook.view().diagram.cards[0];

  act(() => hook.view().select(card.id));

  expect(hook.view().selected).toEqual(Option.some(card));

  act(() => hook.view().clearSelection());

  expect(hook.view().selected).toEqual(Option.none());
  hook.unmount();
});

test("寸法の更新で配置を更新しても選択を維持する", () => {
  const hook = renderDependencyHook("data 注文 = string\n");
  const card = hook.view().diagram.cards[0];

  hook.publish();
  act(() => hook.view().select(card.id));
  hook.publish({ sizes: new Map([[card.id, { width: 400, height: 300 }]]) });

  expect(Option.unwrap(hook.view().layout)).toMatchObject({
    ok: true,
    value: { nodes: [{ width: 400, height: 300 }] },
  });
  expect(hook.view().selected).toEqual(Option.some(card));
  hook.unmount();
});

test("配置失敗後の再試行で正常な計測結果を採用できる", () => {
  const hook = renderDependencyHook("data 注文 = string\n");

  hook.publish({ sizes: new Map() });

  expect(Result.isErr(Option.unwrap(hook.view().layout))).toBe(true);

  act(() => hook.view().retry());
  hook.publish();

  expect(Result.isOk(Option.unwrap(hook.view().layout))).toBe(true);
  hook.unmount();
});
