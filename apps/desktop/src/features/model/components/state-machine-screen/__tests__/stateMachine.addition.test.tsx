import { afterEach, expect, test } from "vitest";
import { createStateMachineRenderer } from "./stateMachine.test-support";

const screens = createStateMachineRenderer();

afterEach(() => screens.unmountAll());

const source = `state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 完了通知
state-machine 返金 =
  state: 待機
  state: 完了 terminal`;

test("追加した状態を選択し、そのままインスペクターで名前を変更できる", () => {
  const screen = screens.render(source);

  screen.openState();
  screen.enterText("状態名", "保留");
  screen.submit();

  expect(
    screen.host
      .querySelector('[data-selected="true"]')
      ?.getAttribute("aria-label"),
  ).toBe("保留 normal");
  expect(
    screen.host.querySelector<HTMLButtonElement>('button[type="submit"]')
      ?.textContent,
  ).toBe("変更を反映");
  expect(
    screen.host.querySelector<HTMLInputElement>('input[aria-label="状態名"]')
      ?.value,
  ).toBe("保留");

  screen.enterText("状態名", "確認中");
  screen.submit();

  expect(screen.source()).toContain("state: 確認中");
  expect(screen.source()).not.toContain("state: 保留");
  expect(
    screen.host
      .querySelector('[data-selected="true"]')
      ?.getAttribute("aria-label"),
  ).toBe("確認中 normal");
});

test("別マシンに同じ遷移があっても追加先の遷移を選択して編集できる", () => {
  const screen = screens.render(source, 1);

  screen.openTransition();
  screen.changeSelect(screen.select("遷移先"), "完了");
  screen.enterEvent("完了通知");
  screen.submit();

  expect(
    screen.host
      .querySelector('[data-selected="true"]')
      ?.getAttribute("aria-label"),
  ).toBe("待機 から 完了 へ、完了通知");
  expect(screen.host.querySelector('button[type="submit"]')?.textContent).toBe(
    "変更を反映",
  );
  expect(
    screen.host.querySelector<HTMLInputElement>(
      'input[aria-label="イベント名"]',
    )?.value,
  ).toBe("完了通知");

  screen.enterEvent("返金通知");
  screen.submit();

  expect(screen.source()).toContain(
    "transition: 待機 -> 完了 on 完了通知\nstate-machine 返金",
  );
  expect(screen.source()).toContain("transition: 待機 -> 完了 on 返金通知");
  expect(
    screen.host
      .querySelector('[data-selected="true"]')
      ?.getAttribute("aria-label"),
  ).toBe("待機 から 完了 へ、返金通知");
});

test("状態の追加後もパレットから続けて追加でき、最後に追加した状態を選択する", () => {
  const screen = screens.render(source);

  screen.openState();
  screen.enterText("状態名", "保留");
  screen.submit();
  screen.openState();

  expect(
    screen.host.querySelector<HTMLInputElement>('input[aria-label="状態名"]')
      ?.value,
  ).toBe("");

  screen.enterText("状態名", "確認中");
  screen.submit();

  expect(screen.source()).toContain("state: 保留");
  expect(screen.source()).toContain("state: 確認中");
  expect(screen.host.querySelectorAll('[data-selected="true"]')).toHaveLength(
    1,
  );
  expect(
    screen.host
      .querySelector('[data-selected="true"]')
      ?.getAttribute("aria-label"),
  ).toBe("確認中 normal");
});

test("遷移の追加後もパレットから続けて追加でき、最後に追加した遷移を選択する", () => {
  const screen = screens.render(source);

  screen.openTransition();
  screen.changeSelect(screen.select("遷移先"), "完了");
  screen.enterEvent("中止");
  screen.submit();
  screen.openTransition();
  screen.changeSelect(screen.select("遷移先"), "完了");
  screen.enterEvent("強制終了");
  screen.submit();

  expect(screen.source()).toContain("transition: 待機 -> 完了 on 中止");
  expect(screen.source()).toContain("transition: 待機 -> 完了 on 強制終了");
  expect(screen.host.querySelectorAll('[data-selected="true"]')).toHaveLength(
    1,
  );
  expect(
    screen.host
      .querySelector('[data-selected="true"]')
      ?.getAttribute("aria-label"),
  ).toBe("待機 から 完了 へ、強制終了");
});

test("状態の追加に失敗した場合は入力と追加フォームを保持する", () => {
  const screen = screens.render(source);

  screen.openState();
  screen.enterText("状態名", "待機");
  screen.submit();

  expect(screen.source()).toBe(source);
  expect(screen.host.querySelector('[role="alert"]')?.textContent).toBe(
    "同じ名前の状態が既にあります",
  );
  expect(screen.host.querySelector('button[type="submit"]')?.textContent).toBe(
    "追加",
  );
  expect(
    screen.host.querySelector<HTMLInputElement>('input[aria-label="状態名"]')
      ?.value,
  ).toBe("待機");
  expect(screen.host.querySelector('[data-selected="true"]')).toBeNull();
});

test("状態追加でフォームが切り替わってもグラフへキーボードフォーカスを引き継ぐ", async () => {
  const screen = screens.render(source);

  screen.openState();
  screen.enterText("状態名", "保留");
  screen.host
    .querySelector<HTMLInputElement>('input[aria-label="状態名"]')!
    .focus();
  screen.submit();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  expect(document.activeElement).toBe(
    screen.host.querySelector('[data-selected="true"]'),
  );
});

test("マシンを新規作成すると以前の選択位置をリセットして新しいマシンを表示する", () => {
  const screen = screens.render(source, 1);

  screen.selectNode("待機");
  screen.replaceSource("data ID = string");
  screen.enterText("マシン名", "配送");
  screen.submit();

  expect(screen.selectedMachineIndex()).toBe(0);
  expect(
    screen.host.querySelector<HTMLSelectElement>(
      ".state-machine-screen__toolbar select",
    )?.selectedOptions[0]?.textContent,
  ).toBe("配送");
  expect(
    screen.host.querySelector(".state-machine-screen__details")?.textContent,
  ).toContain("配送");

  screen.openState();
  screen.enterText("状態名", "未発送");
  screen.submit();

  expect(
    screen.host
      .querySelector('[data-selected="true"]')
      ?.getAttribute("aria-label"),
  ).toBe("未発送 normal");
});
