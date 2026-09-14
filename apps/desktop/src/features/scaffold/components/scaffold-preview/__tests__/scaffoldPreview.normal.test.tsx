import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { ScaffoldPreview } from "../../../index";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup();
  }
});

function setup(text: string) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  function Flow() {
    const [state, setState] = useState("preview");
    if (state !== "preview") {
      return <p>{state}</p>;
    }
    return (
      <ScaffoldPreview
        text={text}
        onConfirm={() => setState("保存先選択")}
        onCancel={() => setState("キャンバス")}
      />
    );
  }
  act(() => root.render(<Flow />));
  cleanups.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  return host;
}

test("生成全文を省略せず読み取り専用で表示する", () => {
  const text = `${"data 注文 = string // TODO 詳細化\n".repeat(300)}// 未変換 <script> & 最終行\n`;
  const host = setup(text);
  const textarea = host.querySelector("textarea");
  expect(textarea?.value).toBe(text);
  expect(textarea?.readOnly).toBe(true);
  expect(host.querySelector("script")).toBeNull();
});

test("キャンセルすると確認画面を閉じ、保存先選択に進まない", () => {
  const host = setup("data 注文 = string");
  act(() => host.querySelectorAll("button")[0]?.click());
  expect(host.textContent).toBe("キャンバス");
  expect(host.querySelector("textarea")).toBeNull();
});

test("確定すると保存先選択に進む", () => {
  const host = setup("data 注文 = string");
  act(() => host.querySelectorAll("button")[1]?.click());
  expect(host.textContent).toBe("保存先選択");
});
