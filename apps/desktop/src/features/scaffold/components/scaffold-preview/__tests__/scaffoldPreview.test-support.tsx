import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { ScaffoldPreview } from "../../../index";

const cleanups: (() => void)[] = [];

/** 各テストの後片付け。マウントした Flow を unmount してホストを取り除く。 */
export function cleanupScaffoldPreviews(): void {
  for (const cleanup of cleanups.splice(0)) {
    cleanup();
  }
}

/** 確認画面の遷移先を文言で表す、テスト用の画面状態。 */
type FlowState = "preview" | "保存先選択" | "キャンバス";

/** 確認画面と遷移先を1つにまとめた、テスト用のフロー。 */
function Flow({ text }: Readonly<{ text: string }>) {
  const [state, setState] = useState<FlowState>("preview");
  const preview = (
    <ScaffoldPreview
      text={text}
      onConfirm={() => setState("保存先選択")}
      onCancel={() => setState("キャンバス")}
    />
  );
  return state === "preview" ? preview : <p>{state}</p>;
}

/**
 * 確認画面をマウントし、操作対象のホスト要素を返す。
 *
 * @param text 確認画面へ表示する生成全文。
 * @returns マウント先のホスト要素。
 */
export function setupScaffoldPreview(text: string): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(<Flow text={text} />));
  cleanups.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  return host;
}
