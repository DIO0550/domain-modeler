import { act } from "react";
import { expect, test } from "vitest";
import { DependencyInspector } from "..";
import {
  renderContent,
  renderDependency,
} from "../../__tests__/dependencyView.test-support";

test("未選択ではモデル選択の案内を表示する", () => {
  const screen = renderDependency("data 注文 = string", {
    children: <DependencyInspector />,
  });

  expect(screen.host.querySelector("aside")!.textContent).toContain(
    "モデルを選択すると定義と参照関係を確認できます",
  );
  screen.unmount();
});

test("選択したworkflowの名前と入力・出力・エラーを表示する", () => {
  const screen = renderDependency(
    "workflow 処理 =\n  input: string\n  output: int\n  error: string\n",
  );

  act(() =>
    screen.host
      .querySelector<HTMLElement>('[role="button"][data-kind="WORKFLOW"]')!
      .click(),
  );

  const inspector = screen.host.querySelector("aside")!;

  expect(inspector.textContent).toContain("WORKFLOW処理");
  expect(inspector.textContent).toContain("入力string出力intエラーstring");
  screen.unmount();
});

test("選択した未定義名に架空の型や編集用の本文を表示しない", () => {
  const screen = renderDependency("data 注文 = 不明な注文");

  act(() =>
    screen.host
      .querySelector<HTMLElement>('[role="button"][data-kind="未定義"]')!
      .click(),
  );

  const inspector = screen.host.querySelector("aside")!;

  expect(inspector.textContent).toContain("未定義不明な注文");
  expect(inspector.textContent).toContain("警告定義がありません");
  expect(inspector.querySelector("textarea,pre")).toBeNull();
  screen.unmount();
});

test("選択対象が削除されたら古い種類と構成を残さない", () => {
  const screen = renderDependency("data 注文 = string\ndata 削除対象 = int\n");

  act(() =>
    screen.host
      .querySelectorAll<HTMLElement>('[role="button"][data-node-id]')[1]
      .click(),
  );
  screen.render("data 注文 = string\n");

  const inspector = screen.host.querySelector("aside")!;

  expect(inspector.textContent).not.toContain("削除対象");
  expect(inspector.textContent).toContain("モデルを選択すると");
  screen.unmount();
});

test("Rootの外では選択表示を出さない", () => {
  const screen = renderContent(<DependencyInspector />);

  expect(screen.host.textContent).toBe("");
  screen.unmount();
});
