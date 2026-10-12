import { act } from "react";
import { expect, test } from "vitest";
import { AnalyzedModel } from "../../../../domains/analyzed-model";
import { DependencyRoot } from "..";
import { renderContent } from "../../__tests__/dependencyView.test-support";
import { ContextReadout } from "./dependencyContext.test-support";

test("同じRootの離れた子要素へ選択状態を共有する", () => {
  const screen = renderContent(
    <DependencyRoot
      analyzed={AnalyzedModel.create("data 注文 = string")}
      onEditSource={() => undefined}
    >
      <div>
        <ContextReadout />
      </div>
      <section>
        <ContextReadout />
      </section>
    </DependencyRoot>,
  );

  act(() => screen.host.querySelector<HTMLButtonElement>("button")!.click());

  expect(
    [...screen.host.querySelectorAll("output")].map(
      (output) => output.textContent,
    ),
  ).toEqual(["注文", "注文"]);
  screen.unmount();
});

test("別々の文書のRootで選択状態を共有しない", () => {
  const screen = renderContent(
    <>
      <section aria-label="文書A">
        <DependencyRoot
          analyzed={AnalyzedModel.create("data 文書A = string")}
          onEditSource={() => undefined}
        >
          <ContextReadout />
        </DependencyRoot>
      </section>
      <section aria-label="文書B">
        <DependencyRoot
          analyzed={AnalyzedModel.create("data 文書B = int")}
          onEditSource={() => undefined}
        >
          <ContextReadout />
        </DependencyRoot>
      </section>
    </>,
  );

  act(() =>
    screen.host
      .querySelector<HTMLButtonElement>('[aria-label="文書A"] button')!
      .click(),
  );

  expect(
    screen.host.querySelector('[aria-label="文書A"] output')!.textContent,
  ).toBe("文書A");
  expect(
    screen.host.querySelector('[aria-label="文書B"] output')!.textContent,
  ).toBe("未選択");
  screen.unmount();
});

test("Rootの外では状態を捏造せず不在を返す", () => {
  const screen = renderContent(<ContextReadout />);

  expect(screen.host.textContent).toBe("未接続");
  expect(screen.host.querySelector("button")).toBeNull();
  screen.unmount();
});
