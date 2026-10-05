import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createStateMachineViewRenderer } from "./useStateMachineView.test-support";

const views = createStateMachineViewRenderer();

afterEach(() => views.unmountAll());

const source =
  "state-machine 注文 =\n  state: 待機\nstate-machine 返金 =\n  state: 申請";

test("フィットは倍率と表示位置を戻し、選択を保持する", () => {
  const view = views.render(source);

  act(() => {
    view.latest.current!.selectPart("state");
    view.latest.current!.panBy({ x: 50, y: -80 });
    view.latest.current!.zoomBy(2);
  });

  expect(view.latest.current!.zoom).toBe(2);

  act(() => view.latest.current!.fit());

  expect(view.latest.current!.viewport).toEqual({
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
  expect(view.latest.current!.target.kind).toBe("part");
});

test("マシン切替は表示位置と倍率と選択を一緒にリセットする", () => {
  const view = views.render(source);

  act(() => {
    view.latest.current!.panBy({ x: 100, y: 50 });
    view.latest.current!.zoomBy(2, { x: 20, y: 30 });
    view.latest.current!.selectPart("state");
    view.latest.current!.selectMachine(1);
  });

  expect(view.latest.current!.graph!.name).toBe("返金");
  expect(view.latest.current!.viewport).toEqual({
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
  expect(view.latest.current!.target.kind).toBe("none");
});

test("再描画前に連続したパンとズームが来ても全操作を反映する", () => {
  const view = views.render(source);

  act(() => {
    view.latest.current!.panBy({ x: 10, y: 20 });
    view.latest.current!.panBy({ x: 30, y: -5 });
    view.latest.current!.zoomBy(2);
    view.latest.current!.zoomBy(1.25);
  });

  expect(view.latest.current!.viewport).toEqual({
    zoom: 2.5,
    pan: { x: 40, y: 15 },
  });
});
