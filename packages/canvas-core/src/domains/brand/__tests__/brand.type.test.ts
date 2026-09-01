import { expectTypeOf, test } from "vitest";
import type { Brand } from "..";

test("異なるブランドを持つ文字列は別の型になる", () => {
  type StickyKey = Brand<string, "StickyKey">;
  type ConnectionKey = Brand<string, "ConnectionKey">;

  expectTypeOf<StickyKey>().not.toEqualTypeOf<ConnectionKey>();
});
