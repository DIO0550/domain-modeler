import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createStateMachineRenderer } from "./stateMachine.test-support";
import {
  inlineScreen,
  inlineSource as source,
} from "./stateMachineInline.test-support";

const screens = createStateMachineRenderer();

afterEach(() => screens.unmountAll());

test("状態をダブルクリックすると初期値を選択した入力を開き、名前と全参照・座標を1回で変更する", () => {
  const screen = inlineScreen(screens);

  screen.editState("待機");

  const input = screen.input()!;

  expect(document.activeElement).toBe(input);
  expect(input.value).toBe("待機");
  expect(input.selectionStart).toBe(0);
  expect(input.selectionEnd).toBe(2);

  screen.enterName("保留");
  screen.confirm();

  expect(screen.source()).toBe(source.replace(/待機/g, "保留"));
  expect(screen.changes()).toHaveLength(1);
  expect(screen.node("保留").getAttribute("data-selected")).toBe("true");
  expect(
    screen.host.querySelector<HTMLInputElement>('input[aria-label="状態名"]')
      ?.value,
  ).toBe("保留");
  expect(document.activeElement).toBe(screen.canvas.svg);
});

test("イベントをダブルクリックして、端点・コメント・座標を保持して名前を変更する", () => {
  const screen = inlineScreen(screens);

  screen.editEvent("確定");

  expect(screen.input()?.value).toBe("確定");

  screen.enterName("承認");
  screen.confirm();

  expect(screen.source()).toBe(source.replace("on 確定", "on 承認"));
  expect(screen.changes()).toHaveLength(1);
  expect(screen.edge("承認").getAttribute("data-selected")).toBe("true");
  expect(
    screen.host.querySelector<HTMLInputElement>(
      'input[aria-label="イベント名"]',
    )?.value,
  ).toBe("承認");
});

test.each([
  "state",
  "event",
])("%sのEscapeは入力だけを取り消し、DSLと選択を保持する", (kind) => {
  const screen = inlineScreen(screens);
  const edit =
    kind === "state"
      ? () => screen.editState("待機")
      : () => screen.editEvent("確定");

  edit();
  screen.enterName("取消する名前");
  screen.key("Escape");

  expect(screen.input()).toBeNull();
  expect(screen.source()).toBe(source);
  expect(screen.host.querySelectorAll('[data-selected="true"]')).toHaveLength(
    1,
  );
  expect(document.activeElement).toBe(screen.canvas.svg);
});

test("IME変換中のEnter・Escapeで編集を終了しない", () => {
  const screen = inlineScreen(screens);

  screen.editState("待機");
  screen.enterName("保留");
  screen.key("Enter", true);
  screen.key("Escape", true);

  expect(screen.source()).toBe(source);
  expect(document.activeElement).toBe(screen.input());

  screen.confirm();

  expect(screen.source()).toContain("state: 保留");
});

test.each([
  "",
  "完了",
  "空 白",
])("状態名 %j は拒否して入力を保持し、修正後に確定できる", (name) => {
  const screen = inlineScreen(screens);

  screen.editState("待機");
  screen.enterName(name);
  screen.confirm();

  expect(
    screen.host.querySelector(
      ".state-machine-screen__label-editor [role=alert]",
    ),
  ).not.toBeNull();
  expect(screen.source()).toBe(source);
  expect(screen.input()?.value).toBe(name);

  screen.enterName("保留");
  screen.confirm();

  expect(screen.source()).toContain("state: 保留");
});

test("重複イベントは追加せず、同じイベント名のまま確定しても文書や履歴を変更しない", () => {
  const text = `${source}\n  transition: 待機 -> 完了 on 承認`;
  const screen = inlineScreen(screens, text);

  screen.editEvent("確定");
  screen.enterName("承認");
  screen.confirm();

  expect(screen.input()?.value).toBe("承認");
  expect(screen.changes()).toHaveLength(0);

  screen.enterName("確定");
  screen.confirm();

  expect(screen.input()).toBeNull();
  expect(screen.changes()).toHaveLength(0);
  expect(screen.source()).toBe(text);
});

test("終端状態の名前変更でも終端属性を保持し、終端からの不正な遷移名変更は拒否する", () => {
  const screen = inlineScreen(screens);

  screen.editState("完了");
  screen.enterName("終了");
  screen.confirm();

  expect(screen.source()).toContain(
    "state: 終了 terminal // @canvas-position(v1, 500, 200)",
  );

  const invalid = inlineScreen(
    screens,
    `${source}\n  transition: 完了 -> 待機 on 戻る`,
  );

  invalid.editEvent("戻る");
  invalid.enterName("取消");
  invalid.confirm();

  expect(
    invalid.host.querySelector(
      ".state-machine-screen__label-editor [role=alert]",
    )?.textContent,
  ).toContain("終端状態");
  expect(invalid.changes()).toHaveLength(0);
});

test("フォーカスを確定・取消や右プロパティへ移しても下書きを保存せず入力を保持する", () => {
  const screen = inlineScreen(screens);

  screen.editState("待機");
  screen.enterName("保留");
  act(() =>
    screen.host
      .querySelector<HTMLButtonElement>(
        ".state-machine-screen__label-editor button",
      )!
      .focus(),
  );

  expect(screen.changes()).toHaveLength(0);

  act(() =>
    screen.host
      .querySelector<HTMLInputElement>('input[aria-label="状態名"]')!
      .focus(),
  );

  expect(screen.input()?.value).toBe("保留");
  expect(screen.changes()).toHaveLength(0);

  screen.clickInspectorButton("変更を反映");

  expect(screen.source()).toBe(source);
});

test("外部変更で下書きを破棄し、同じ全文へ戻っても古い入力を再表示しない", () => {
  const screen = inlineScreen(screens);

  screen.editState("待機");
  screen.enterName("破棄");
  screen.replaceSource(`${source}\n// 外部変更`);

  expect(screen.input()).toBeNull();

  screen.replaceSource(source);

  expect(screen.input()).toBeNull();

  screen.editState("待機");

  expect(screen.input()?.value).toBe("待機");
});

test("マシン切替・別要素の選択・空白クリックで入力を破棄し、元へ戻っても持ち越さない", () => {
  const screen = inlineScreen(
    screens,
    `${source}\nstate-machine 返金 =\n  state: 待機`,
  );

  screen.editState("待機");
  screen.enterName("破棄");
  screen.click(screen.node("完了"), 1);

  expect(screen.input()).toBeNull();

  screen.editState("待機");

  const picker = screen.host.querySelector<HTMLSelectElement>(
    ".state-machine-screen__toolbar select",
  )!;

  screen.changeSelect(picker, "1");
  screen.changeSelect(picker, "0");

  expect(screen.input()).toBeNull();

  screen.editState("待機");
  screen.canvas.click({ x: 1500, y: 700 });

  expect(screen.input()).toBeNull();
  expect(screen.changes()).toHaveLength(0);
});

test("重複宣言・未定義参照の状態名は図上編集を開かない", () => {
  const screen = inlineScreen(
    screens,
    `${source}\n  state: 待機\n  transition: 待機 -> 未定義 on 失敗`,
  );

  screen.editState("待機");

  expect(screen.input()).toBeNull();

  screen.editState("未定義");

  expect(screen.input()).toBeNull();
});
