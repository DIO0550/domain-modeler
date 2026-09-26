import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { StateMachine } from "../index";

test("構成要素を並べ替えても選択と画面遷移を共有できる", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let editSourceCount = 0;

  try {
    act(() => root.render(
      <StateMachine.Root value={"state-machine 注文 =\n  state: 待機"}
        onChange={() => undefined} onEditSource={() => { editSourceCount += 1; }}>
        <StateMachine.Inspector />
        <StateMachine.Palette />
        <StateMachine.Graph />
      </StateMachine.Root>
    ));

    expect([...host.querySelectorAll(".state-machine-screen > *")].map((element) => element.getAttribute("aria-label")))
      .toEqual(["ステートマシンのインスペクター", "ステートマシンのパレット", "ステートマシンのグラフ"]);

    const stateButton = [...host.querySelectorAll(".state-machine-screen__palette button")]
      .find((button) => button.textContent === "状態");
    act(() => stateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(host.querySelector('input[aria-label="状態名"]')).not.toBeNull();

    act(() => host.querySelector(".state-machine-screen__node")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(host.querySelector('input[aria-label="状態名"]')).toBeNull();
    expect(host.querySelector(".state-machine-screen__details")?.textContent).toContain("待機");

    act(() => host.querySelector(".state-machine-screen__source")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(editSourceCount).toBe(1);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
