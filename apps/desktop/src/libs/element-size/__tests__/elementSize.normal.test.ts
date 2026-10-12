import { afterEach, expect, test, vi } from "vitest";
import { ElementSize } from "..";
import { createSizeEnvironment } from "./elementSize.test-support";

afterEach(() => vi.unstubAllGlobals());

test("計測対象のカードだけをIDと実寸で通知する", () => {
  const environment = createSizeEnvironment();
  environment.add({ id: "A", width: 280.5, height: 120.25 });
  environment.add({ id: "B", width: 400, height: 230 });
  environment.add({ id: "対象外", width: 999, height: 999, measured: false });
  const measurements: ReadonlyMap<
    string,
    Readonly<{ width: number; height: number }>
  >[] = [];

  const stop = ElementSize.observe(environment.container, (sizes) =>
    measurements.push(sizes),
  );

  expect([...measurements[0]]).toEqual([
    ["A", { width: 280.5, height: 120.25 }],
    ["B", { width: 400, height: 230 }],
  ]);
  stop();
});

test("カード寸法の変更を通知し、前の計測結果を書き換えない", () => {
  const environment = createSizeEnvironment();
  const card = environment.add({ id: "注文", width: 280, height: 120 });
  const measurements: ReadonlyMap<
    string,
    Readonly<{ width: number; height: number }>
  >[] = [];
  const stop = ElementSize.observe(environment.container, (sizes) =>
    measurements.push(sizes),
  );

  card.resize({ width: 300, height: 180 });

  expect(measurements[0].get("注文")).toEqual({ width: 280, height: 120 });
  expect(measurements[1].get("注文")).toEqual({ width: 300, height: 180 });
  stop();
});

test("購読解除後の寸法変更を通知しない", () => {
  const environment = createSizeEnvironment();
  const card = environment.add({ id: "注文", width: 280, height: 120 });
  const measurements: ReadonlyMap<string, unknown>[] = [];
  const stop = ElementSize.observe(environment.container, (sizes) =>
    measurements.push(sizes),
  );

  stop();
  card.resize({ width: 500, height: 500 });

  expect(measurements).toHaveLength(1);
});

test("別々の図の購読を一方の解除で止めない", () => {
  const environment = createSizeEnvironment();
  const card = environment.add({ id: "注文", width: 280, height: 120 });
  const first: ReadonlyMap<string, unknown>[] = [];
  const second: ReadonlyMap<string, unknown>[] = [];
  const stopFirst = ElementSize.observe(environment.container, (sizes) =>
    first.push(sizes),
  );
  const stopSecond = ElementSize.observe(environment.container, (sizes) =>
    second.push(sizes),
  );

  stopFirst();
  card.resize({ width: 300, height: 180 });

  expect(first).toHaveLength(1);
  expect(second[1].get("注文")).toEqual({ width: 300, height: 180 });
  stopSecond();
});
