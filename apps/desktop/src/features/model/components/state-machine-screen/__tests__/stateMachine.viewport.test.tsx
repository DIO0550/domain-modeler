import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createStateMachineRenderer } from "./stateMachine.test-support";
import { viewportCanvas } from "./stateMachineViewport.test-support";

const screens = createStateMachineRenderer();

afterEach(() => screens.unmountAll());

const source =
  "state-machine 注文 =\n  initial: 待機\n  state: 待機\n  state: 完了 terminal\n  transition: 待機 -> 完了 on 確定";

test("空白のドラッグで図をポインターに追従させ、選択と文書を保持する", () => {
  const screen = screens.render(source);
  const canvas = viewportCanvas(screen.host);

  screen.selectNode("待機");
  canvas.pointer("pointerdown", { x: 400, y: 300 });
  canvas.pointer("pointermove", { x: 480, y: 340 });

  expect(canvas.bounds().left).toBe(canvas.fitted.left - 40);
  expect(canvas.bounds().top).toBe(canvas.fitted.top - 20);
  expect(canvas.svg.getAttribute("data-panning")).toBe("true");

  canvas.pointer("pointerup", { x: 480, y: 340 });
  act(() =>
    canvas.svg.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );
  canvas.pointer("lostpointercapture", { x: 0, y: 0 });

  expect(canvas.bounds().left).toBe(canvas.fitted.left - 40);
  expect(
    screen.host
      .querySelector('[aria-label="待機 initial"]')!
      .getAttribute("data-selected"),
  ).toBe("true");
  expect(canvas.svg.getAttribute("data-panning")).toBe("false");
  expect(screen.changes()).toEqual([]);
});

test("3pxの手ぶれは選択解除だけで、4pxからパンを開始する", () => {
  const screen = screens.render(source);
  const canvas = viewportCanvas(screen.host);

  screen.selectNode("待機");
  canvas.pointer("pointerdown", { x: 400, y: 300 });
  canvas.pointer("pointermove", { x: 403, y: 300 });
  canvas.pointer("pointerup", { x: 403, y: 300 });

  expect(canvas.bounds()).toEqual(canvas.fitted);
  expect(screen.host.querySelector('[data-selected="true"]')).toBeNull();

  canvas.pointer("pointerdown", { x: 400, y: 300 });
  canvas.pointer("pointermove", { x: 404, y: 300 });
  canvas.pointer("pointerup", { x: 404, y: 300 });

  expect(canvas.bounds().left).toBe(canvas.fitted.left - 2);
  expect(screen.changes()).toEqual([]);
});

test.each([
  "Escape",
  "pointercancel",
] as const)("%sでパンを取り消し、取消後の解放では再確定しない", (cancel) => {
  const screen = screens.render(source);
  const canvas = viewportCanvas(screen.host);

  canvas.pointer("pointerdown", { x: 400, y: 300 });
  canvas.pointer("pointermove", { x: 480, y: 340 });

  expect(canvas.bounds()).not.toEqual(canvas.fitted);

  canvas.cancelGesture(cancel);

  canvas.pointer("pointerup", { x: 480, y: 340 });
  canvas.pointer("lostpointercapture", { x: 480, y: 340 });

  expect(canvas.bounds()).toEqual(canvas.fitted);
  expect(screen.changes()).toEqual([]);
});

test("パン中に捕捉が失われても最後に表示した位置を一度だけ維持する", () => {
  const screen = screens.render(source);
  const canvas = viewportCanvas(screen.host);

  canvas.pointer("pointerdown", { x: 400, y: 300 });
  canvas.pointer("pointermove", { x: 480, y: 340 });
  canvas.pointer("lostpointercapture", { x: 0, y: 0 });
  canvas.pointer("pointerup", { x: 480, y: 340 });

  expect(canvas.bounds().left).toBe(canvas.fitted.left - 40);
  expect(canvas.bounds().top).toBe(canvas.fitted.top - 20);
});

test.each([
  { deltaMode: 0, deltaX: 20, deltaY: 40, x: 10, y: 20 },
  { deltaMode: 1, deltaX: 2, deltaY: 3, x: 16, y: 24 },
  { deltaMode: 2, deltaX: 1, deltaY: -1, x: 500, y: -400 },
])("修飾キーなしのホイールを水平・垂直パンに変換する: $deltaMode", (input) => {
  const screen = screens.render(source);
  const canvas = viewportCanvas(screen.host);
  const event = canvas.wheel(input);

  expect(event.defaultPrevented).toBe(true);
  expect(canvas.bounds().left).toBe(canvas.fitted.left + input.x);
  expect(canvas.bounds().top).toBe(canvas.fitted.top + input.y);
  expect(canvas.zoom()).toBe("100%");
  expect(screen.changes()).toEqual([]);
});

test.each([
  { ctrlKey: true },
  { metaKey: true },
])("Ctrl/⌘ホイールはパン後もポインター位置を維持して拡大縮小する: %j", (modifier) => {
  const screen = screens.render(source);
  const canvas = viewportCanvas(screen.host);

  canvas.wheel({ deltaX: 40, deltaY: 60 });

  const before = canvas.bounds();
  const anchor = { x: before.left + 200, y: before.top + 130 };
  const event = canvas.wheel({ deltaY: -200, ...modifier });
  const after = canvas.bounds();

  expect(event.defaultPrevented).toBe(true);
  expect(after.width).toBeLessThan(before.width);
  expect(canvas.zoom()).toBe("149%");
  expect((anchor.x - after.left) / after.width).toBeCloseTo(200 / before.width);
  expect((anchor.y - after.top) / after.height).toBeCloseTo(
    130 / before.height,
  );

  canvas.wheel({ deltaY: 200, ...modifier });

  expect(canvas.zoom()).toBe("100%");
  expect(canvas.bounds().left).toBeCloseTo(before.left);
  expect(canvas.bounds().top).toBeCloseTo(before.top);
  expect(screen.changes()).toEqual([]);
});

test("フィットでパンと倍率を戻し、続けてマシン切替しても初期表示になる", () => {
  const screen = screens.render(
    `${source}\nstate-machine 返金 =\n  state: 申請`,
  );
  const canvas = viewportCanvas(screen.host);

  canvas.wheel({ deltaX: 50, deltaY: 80 });
  canvas.button("拡大");

  expect(canvas.zoom()).toBe("125%");

  canvas.button("フィット");

  expect(canvas.bounds()).toEqual(canvas.fitted);
  expect(canvas.zoom()).toBe("100%");

  canvas.wheel({ deltaX: 50, deltaY: 80 });
  canvas.button("拡大");
  screen.changeSelect(
    screen.host.querySelector(".state-machine-screen__toolbar select")!,
    "1",
  );

  const switched = viewportCanvas(screen.host);
  const fresh = viewportCanvas(
    screens.render("state-machine 返金 =\n  state: 申請").host,
  );

  expect(switched.bounds()).toEqual(fresh.bounds());
  expect(switched.zoom()).toBe("100%");
  expect(screen.changes()).toEqual([]);
});

test("パン・ズーム後も配置位置をSVG座標へ変換して保存する", () => {
  const screen = screens.render(source);
  const canvas = viewportCanvas(screen.host);

  canvas.wheel({ deltaX: 40, deltaY: 60 });
  canvas.button("拡大");

  const visible = canvas.bounds();

  screen.openState();
  canvas.click({ x: 600, y: 400 });

  expect(visible.left + 200).toBeCloseTo(216);
  expect(visible.top + 144).toBeCloseTo(138);
  expect(screen.source()).toContain("@canvas-position(v1, 216, 138)");
  expect(screen.changes()).toHaveLength(1);
});

test("状態の移動中にはホイールで表示を動かさない", () => {
  const screen = screens.render(source);
  const canvas = viewportCanvas(screen.host);
  const node = screen.host.querySelector('[aria-label="待機 initial"]')!;

  canvas.pointer("pointerdown", { x: 300, y: 240 }, node);
  canvas.wheel({ deltaX: 50, deltaY: 80 });
  canvas.wheel({ deltaY: -100, ctrlKey: true });

  expect(canvas.bounds()).toEqual(canvas.fitted);
  expect(canvas.zoom()).toBe("100%");

  canvas.pointer("pointerup", { x: 300, y: 240 });

  expect(screen.changes()).toEqual([]);
});

test("空白ドラッグ中に文書が変わったらパンの一時表示と確定を取り消す", () => {
  const screen = screens.render(source);
  const canvas = viewportCanvas(screen.host);

  canvas.pointer("pointerdown", { x: 400, y: 300 });
  canvas.pointer("pointermove", { x: 480, y: 340 });

  expect(canvas.bounds()).not.toEqual(canvas.fitted);

  const external = source.replace("on 確定", "on 変更");

  screen.replaceSource(external);
  canvas.pointer("pointerup", { x: 480, y: 340 });

  expect(canvas.bounds()).toEqual(canvas.fitted);
  expect(screen.source()).toBe(external);
});

test("SVGのアンマウント時はwheel購読を解除する", () => {
  const screen = screens.render(source);
  const canvas = viewportCanvas(screen.host);

  screens.unmountAll();

  expect(canvas.wheel({ deltaY: 40 }).defaultPrevented).toBe(false);
});
