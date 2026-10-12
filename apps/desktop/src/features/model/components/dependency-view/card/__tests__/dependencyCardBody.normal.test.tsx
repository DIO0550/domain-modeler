import { expect, test } from "vitest";
import { DependencyCardBody } from "..";
import {
  createDependencyLayout,
  renderContent,
} from "../../__tests__/dependencyView.test-support";

test("workflowの名前・種類・各役割と型名を読み取れる文字で表示する", () => {
  const { diagram } = createDependencyLayout(
    "workflow 処理 =\n  input: string list option\n  output: int OR string\n  error: string\n",
  );

  const screen = renderContent(<DependencyCardBody card={diagram.cards[0]} />);

  expect(screen.host.textContent).toContain("WORKFLOW処理");
  expect(screen.host.textContent).toContain("入力string list option");
  expect(screen.host.textContent).toContain("出力int OR string");
  expect(screen.host.textContent).toContain("エラーstring");
  screen.unmount();
});

test("長い日本語の名前と構成要素を途中で省略しない", () => {
  const name = "商品配送先住所と配送時の非常に長い詳細情報";
  const { diagram } = createDependencyLayout(
    `data ${name} = string list option AND int option list`,
  );

  const screen = renderContent(<DependencyCardBody card={diagram.cards[0]} />);

  expect(screen.host.textContent).toContain(name);
  expect(screen.host.textContent).toContain(
    "ANDstring list optionANDint option list",
  );
  screen.unmount();
});
