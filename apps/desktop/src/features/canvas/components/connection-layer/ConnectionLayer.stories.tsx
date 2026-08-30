import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  type Connection,
  ConnectionId,
  Document,
  Sticky as StickyModel,
  StickyId,
} from "@domain-modeler/canvas-core";
import { Sticky } from "../sticky";
import { ConnectionLayer } from "./index";

const actorId = StickyId.create("stk_actor000000");
const commandId = StickyId.create("stk_command0000");
const aggregateId = StickyId.create("stk_aggregate000");
const eventId = StickyId.create("stk_event000000");

const stickies = [
  StickyModel.create(
    actorId,
    "actor",
    "購買担当",
    { x: 40, y: 80 },
    { width: 120, height: 80 },
  ),
  StickyModel.create(
    commandId,
    "command",
    "注文を確定する",
    { x: 260, y: 70 },
    { width: 160, height: 100 },
  ),
  StickyModel.create(
    aggregateId,
    "aggregate",
    "注文",
    { x: 530, y: 50 },
    { width: 200, height: 140 },
  ),
  StickyModel.create(
    eventId,
    "event",
    "注文が確定した",
    { x: 300, y: 300 },
    { width: 160, height: 100 },
  ),
];

const connections: readonly Connection[] = [
  {
    id: ConnectionId.create("con_actor_command"),
    from: actorId,
    to: commandId,
    fromAnchor: "right",
    toAnchor: "left",
    label: "操作",
    note: "",
  },
  {
    id: ConnectionId.create("con_command_aggregate"),
    from: commandId,
    to: aggregateId,
    label: "処理",
    note: "",
  },
  {
    id: ConnectionId.create("con_command_event"),
    from: commandId,
    to: eventId,
    fromAnchor: "bottom",
    toAnchor: "top",
    label: "ルール外",
    note: "",
  },
];

const sampleDocument = {
  ...Document.empty("接続線サンプル"),
  stickies,
  connections,
};

const meta: Meta<typeof ConnectionLayer> = {
  component: ConnectionLayer,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof ConnectionLayer>;

export const Default: Story = {
  args: {
    document: sampleDocument,
  },
  render: (args) => (
    <div className="sticky-story">
      <ConnectionLayer {...args} />
      {args.document.stickies.map((sticky) => (
        <Sticky key={sticky.id} sticky={sticky} />
      ))}
    </div>
  ),
};
