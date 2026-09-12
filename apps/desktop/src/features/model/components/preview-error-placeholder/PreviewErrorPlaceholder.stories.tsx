import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Declaration,
  ErrorDecl,
  Parse,
  SourceRange,
  type Diagnostic,
} from "@domain-modeler/model-core";
import { PreviewErrorPlaceholder } from "./index";

type ErrorArgs = Readonly<{
  decl: ErrorDecl;
  diagnostics: readonly Diagnostic[];
}>;

const errorArgs = (source: string): ErrorArgs => {
  const parsed = Parse.parse(source);
  const decl =
    parsed.document.declarations.find(Declaration.isError) ??
    ErrorDecl.create(SourceRange.onLine(1, 1, 1));
  return { decl, diagnostics: parsed.diagnostics };
};

const rangeError = errorArgs("data 数量 = int constrained 10..1");
const missingName = errorArgs("data = string");
const mixedError = errorArgs(`data 数量 = int constrained 10..1
ゴミ行
data 注文ID = string`);

const meta: Meta<typeof PreviewErrorPlaceholder> = {
  component: PreviewErrorPlaceholder,
  argTypes: {
    decl: { control: false },
    diagnostics: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="preview-error-placeholder-story">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PreviewErrorPlaceholder>;

export const Default: Story = {
  args: rangeError,
};

export const AllProps: Story = {
  decorators: [
    (Story) => (
      <div className="preview-error-placeholder-story preview-error-placeholder-story--gallery">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <PreviewErrorPlaceholder
        decl={rangeError.decl}
        diagnostics={rangeError.diagnostics}
      />
      <PreviewErrorPlaceholder
        decl={missingName.decl}
        diagnostics={missingName.diagnostics}
      />
    </>
  ),
};

export const EdgeCases: Story = {
  args: mixedError,
};
