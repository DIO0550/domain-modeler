import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent } from "storybook/test";
import {
  Document,
  Sticky as StickyModel,
  StickyId,
  STICKY_TYPES,
} from "@domain-modeler/canvas-core";
import { CanvasEditor } from "./index";

const meta: Meta<typeof CanvasEditor> = {
  component: CanvasEditor,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="canvas-view-story">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CanvasEditor>;

const documentWithEvent = {
  ...Document.empty(),
  stickies: [
    StickyModel.create(
      StickyId.create("stk_existing000"),
      STICKY_TYPES.event,
      "注文が確定した",
      { x: 24, y: 24 },
      { width: 160, height: 100 },
    ),
  ],
};

const documentWithTwoStickies = {
  ...documentWithEvent,
  stickies: [
    ...documentWithEvent.stickies,
    StickyModel.create(
      StickyId.create("stk_command0000"),
      STICKY_TYPES.command,
      "通知する",
      { x: 280, y: 24 },
      { width: 160, height: 100 },
    ),
  ],
};

/**
 * キャンバス面の指定位置をクリックする。
 *
 * @param canvas Storybook の canvas。
 * @param point 面の左上からの座標。
 */
const clickSurfaceAt = async (
  canvas: {
    getByRole: (
      role: string,
      options: { name: string },
    ) => HTMLElement;
  },
  point: Readonly<{ x: number; y: number }>,
): Promise<void> => {
  const surface = canvas.getByRole("region", { name: "キャンバス" });
  const rect = surface.getBoundingClientRect();
  await userEvent.pointer({
    keys: "[MouseLeft]",
    target: surface,
    coords: { clientX: rect.left + point.x, clientY: rect.top + point.y },
  });
};

export const Default: Story = {
  args: {
    zoom: 1,
    saveStatus: "saved",
  },
};

export const AllProps: Story = {
  args: {
    zoom: 1,
    saveStatus: "saving",
    initialDocument: documentWithEvent,
  },
  play: async ({ canvas }) => {
    await clickSurfaceAt(canvas, { x: 40, y: 40 });
  },
};

export const Editing: Story = {
  args: {
    zoom: 1,
    saveStatus: "saved",
    initialDocument: documentWithEvent,
  },
  play: async ({ canvas }) => {
    const surface = canvas.getByRole("region", { name: "キャンバス" });
    const rect = surface.getBoundingClientRect();
    await userEvent.pointer({
      keys: "[MouseLeft][MouseLeft]",
      target: surface,
      coords: { clientX: rect.left + 40, clientY: rect.top + 40 },
    });
  },
};

export const CreatingConnection: Story = {
  args: {
    zoom: 1,
    saveStatus: "saved",
    initialDocument: documentWithTwoStickies,
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "接続" }));
    await clickSurfaceAt(canvas, { x: 48, y: 48 });
    await clickSurfaceAt(canvas, { x: 304, y: 48 });
  },
};

export const EdgeCases: Story = {
  args: {
    zoom: 0.1,
    saveStatus: "failed",
  },
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "External System" }),
    );
    await clickSurfaceAt(canvas, { x: 48, y: 48 });
  },
};
