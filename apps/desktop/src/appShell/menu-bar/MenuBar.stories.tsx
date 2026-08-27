import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent } from "storybook/test";
import { MenuState } from "../menu";
import {
  type TabDocumentType,
  type TabsAction,
  TabsState,
} from "../tabs";
import { MenuBar } from "./index";

const meta: Meta<typeof MenuBar> = {
  component: MenuBar,
  args: {
    onCommand: fn(),
  },
  argTypes: {
    onCommand: { control: false },
    menuState: { control: false },
  },
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="menu-bar-story">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof MenuBar>;

const openTabs = (
  first: Readonly<{ path: string; documentType: TabDocumentType }>,
  ...rest: readonly Readonly<{ path: string; documentType: TabDocumentType }>[]
): TabsState => {
  const documents = [first, ...rest];
  return documents.reduce<TabsState>(
    (state, document) =>
      TabsState.reducer(state, {
        type: "openTab",
        path: document.path,
        documentType: document.documentType,
      }),
    TabsState.create(),
  );
};

const applyActions = (
  state: TabsState,
  actions: readonly TabsAction[],
): TabsState => actions.reduce(TabsState.reducer, state);

const openGenerateMenu: Story["play"] = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("menuitem", { name: "生成" }));
};

export const Default: Story = {
  args: {
    menuState: MenuState.from(
      openTabs({
        path: "/Users/demo/shop/order.dcanvas",
        documentType: "canvas",
      }),
    ),
  },
};

export const Empty: Story = {
  args: {
    menuState: MenuState.from(TabsState.create()),
  },
  play: openGenerateMenu,
};

export const CanvasActive: Story = {
  args: {
    menuState: MenuState.from(
      openTabs(
        { path: "/Users/demo/shop/order.dcanvas", documentType: "canvas" },
        { path: "/Users/demo/shop/order.dmodel", documentType: "model" },
      ),
    ),
  },
  play: openGenerateMenu,
};

export const ModelActive: Story = {
  args: {
    menuState: MenuState.from(
      applyActions(
        openTabs(
          { path: "/Users/demo/shop/order.dcanvas", documentType: "canvas" },
          { path: "/Users/demo/shop/order.dmodel", documentType: "model" },
        ),
        [{ type: "activateTab", path: "/Users/demo/shop/order.dmodel" }],
      ),
    ),
  },
  play: openGenerateMenu,
};

export const AllProps: Story = {
  args: {
    menuState: MenuState.from(
      openTabs({
        path: "/Users/demo/shop/order.dcanvas",
        documentType: "canvas",
      }),
    ),
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("menuitem", { name: "ファイル" }));
  },
};

export const EdgeCases: Story = {
  args: {
    menuState: MenuState.from(TabsState.create()),
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("menuitem", { name: "ファイル" }));
  },
};
