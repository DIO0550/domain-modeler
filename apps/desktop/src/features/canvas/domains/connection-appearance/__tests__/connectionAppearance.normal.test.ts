import { expect, test } from "vitest";
import {
  type Connection,
  ConnectionId,
  Document,
  Sticky,
  StickyId,
} from "@domain-modeler/canvas-core";
import { ConnectionAppearance } from "../index";

const actorId = StickyId.create("stk_actor000000");
const commandId = StickyId.create("stk_command0000");

const alignedDocument = {
  ...Document.empty(),
  stickies: [
    Sticky.create(
      actorId,
      "actor",
      "購買担当",
      { x: 20, y: 40 },
      { width: 120, height: 80 },
    ),
    Sticky.create(
      commandId,
      "command",
      "注文する",
      { x: 260, y: 30 },
      { width: 160, height: 100 },
    ),
  ],
  connections: [],
};

const alignedConnection: Connection = {
  id: ConnectionId.create("con_aligned0000"),
  from: actorId,
  to: commandId,
  fromAnchor: "right",
  toAnchor: "left",
  label: "操作",
  note: "",
};

test("向かい合うアンカーを水平に結べる接続は直線になる", () => {
  const appearance = ConnectionAppearance.create(
    alignedDocument,
    alignedConnection,
  );

  expect(appearance.some).toBe(true);
  if (!appearance.some) {
    return;
  }
  expect(appearance.value.route).toEqual({
    shape: "straight",
    path: "M 140 80 L 260 80",
    midpoint: { x: 200, y: 80 },
  });
});

test("接続ルール内の種別ペアは通常表示になる", () => {
  const appearance = ConnectionAppearance.create(
    alignedDocument,
    alignedConnection,
  );

  expect(appearance.some && appearance.value.status).toBe("ok");
});

test("空でないラベルは経路の中点に背景幅とともに配置される", () => {
  const appearance = ConnectionAppearance.create(
    alignedDocument,
    alignedConnection,
  );

  expect(appearance.some && appearance.value.label).toEqual({
    visibility: "visible",
    text: "操作",
    position: { x: 200, y: 80 },
    width: 42,
  });
});

test("空文字のラベルは表示しない", () => {
  const appearance = ConnectionAppearance.create(alignedDocument, {
    ...alignedConnection,
    label: "",
  });

  expect(appearance.some && appearance.value.label).toEqual({
    visibility: "hidden",
  });
});

test("向かい合わないアンカーの接続は辺の法線方向へ出る三次ベジェ曲線になる", () => {
  const appearance = ConnectionAppearance.create(alignedDocument, {
    ...alignedConnection,
    fromAnchor: "bottom",
    toAnchor: "top",
  });

  expect(appearance.some).toBe(true);
  if (!appearance.some) {
    return;
  }
  expect(appearance.value.route.shape).toBe("curve");
  expect(appearance.value.route.path).toContain(" C ");
});

test("接続ルール外の種別ペアは警告と推奨接続先を返す", () => {
  const appearance = ConnectionAppearance.create(alignedDocument, {
    ...alignedConnection,
    from: commandId,
    to: actorId,
  });

  expect(appearance.some).toBe(true);
  if (!appearance.some) {
    return;
  }
  expect(appearance.value.status).toBe("warning");
  expect(appearance.value.tooltip).toContain("推奨ルール外");
  expect(appearance.value.tooltip).toContain("Aggregate / External System");
});

test("参照先が存在せずcoreで端点を解決できない接続は表示を返さない", () => {
  const appearance = ConnectionAppearance.create(alignedDocument, {
    ...alignedConnection,
    to: StickyId.create("stk_missing00000"),
  });

  expect(appearance).toEqual({ some: false });
});
