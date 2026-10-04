import { act } from "react";
import { expect } from "vitest";
import { clickNamed, editModel } from "./newDocument.test-support";

export const machineSource = `data 注文ID = string
workflow 注文処理 =
  input: 注文ID
  output: 注文ID
state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定`;

/** 表示モードをユーザー操作で切り替える。 */
export const openMode = async (
  host: HTMLElement,
  mode: "モデル" | "ステートマシン",
) => {
  await clickNamed(host, mode);
  expect(
    host.querySelector(`[aria-label="表示モード"] [aria-current="page"]`)
      ?.textContent,
  ).toBe(mode);
};

/** グラフのパレットから状態を追加する。 */
export const addState = async (host: HTMLElement, name: string) => {
  await clickNamed(host, "状態");
  const input = host.querySelector<HTMLInputElement>(
    'input[aria-label="状態名"]',
  );
  expect(input).not.toBeNull();
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set?.call(input, name);
    input?.dispatchEvent(new Event("input", { bubbles: true }));
    input?.form?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
};

/** テキスト編集後、選択を維持したままグラフを開く。 */
export const editAndOpenGraph = async (host: HTMLElement, source: string) => {
  await editModel(host, source);
  await openMode(host, "ステートマシン");
};

/** 状態・イベントの名前をダブルクリックで編集し、入力だけを先に行う。 */
export const enterGraphName = async (host: HTMLElement, previousName: string, name: string) => {
  const element = [...host.querySelectorAll('.state-machine-screen__node, .state-machine-screen__edge')]
    .find((item) => item.querySelector('text')?.textContent === previousName)!;
  await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })));
  await act(async () => element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, detail: 2 })));
  const input = host.querySelector<HTMLInputElement>('.state-machine-screen__label-editor input')!;
  expect(document.activeElement).toBe(input);
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, name);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  return input;
};
