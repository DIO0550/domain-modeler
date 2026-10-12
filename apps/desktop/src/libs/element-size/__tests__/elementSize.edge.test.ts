import { afterEach, expect, test, vi } from "vitest";
import { ElementSize } from "..";
import { createSizeEnvironment } from "./elementSize.test-support";

afterEach(() => vi.unstubAllGlobals());

test("空の領域では空の計測結果を通知する", () => {
  const environment = createSizeEnvironment();
  const measurements: ReadonlyMap<string, unknown>[] = [];

  const stop = ElementSize.observe(environment.container, (sizes) =>
    measurements.push(sizes),
  );

  expect([...measurements[0]]).toEqual([]);
  stop();
});

test("ゼロ寸法を正常寸法に偽装せず、配置側が判定できるようそのまま通知する", () => {
  const environment = createSizeEnvironment();
  environment.add({ id: "非表示カード", width: 0, height: 0 });
  const measurements: ReadonlyMap<string, unknown>[] = [];

  const stop = ElementSize.observe(environment.container, (sizes) =>
    measurements.push(sizes),
  );

  expect(measurements[0].get("非表示カード")).toEqual({ width: 0, height: 0 });
  stop();
});
