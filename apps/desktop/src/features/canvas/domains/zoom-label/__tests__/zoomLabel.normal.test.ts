import { expect, test } from "vitest";
import { ZoomLabel } from "../index";

test("等倍のズームは 100% と表示する", () => {
  expect(ZoomLabel.fromZoom(1)).toBe("100%");
});

test("下限のズームは 10% と表示する", () => {
  expect(ZoomLabel.fromZoom(0.1)).toBe("10%");
});

test("上限のズームは 400% と表示する", () => {
  expect(ZoomLabel.fromZoom(4)).toBe("400%");
});

test("1.5倍のズームは 150% と表示する", () => {
  expect(ZoomLabel.fromZoom(1.5)).toBe("150%");
});

test("小数のズームは百分率に四捨五入する", () => {
  expect(ZoomLabel.fromZoom(0.336)).toBe("34%");
});
