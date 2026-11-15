import {
  Connection,
  ConnectionId,
  Document,
  Sticky,
  StickyId,
} from "@domain-modeler/canvas-core";
import { ConnectionInteraction } from "..";

export const setupConnectionCanvas = () => {
  const source = Sticky.create(
    StickyId.create("stk_source000000"),
    "command",
    "注文する",
    { x: 0, y: 0 },
    { width: 160, height: 100 },
  );
  const target = Sticky.create(
    StickyId.create("stk_target000000"),
    "event",
    "注文された",
    { x: 300, y: 0 },
    { width: 160, height: 100 },
  );
  const connection = Connection.create(
    ConnectionId.create("con_existing0000"),
    source.id,
    target.id,
    "確定後",
    "",
  );
  const document = {
    ...Document.empty(),
    stickies: [source, target],
    connections: [connection],
  };

  return {
    source,
    target,
    connection,
    document,
    initial: ConnectionInteraction.create(document),
  };
};
