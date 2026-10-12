import { expect, test } from "vitest";
import { DependencyLegend } from "..";
import { renderContent } from "../../__tests__/dependencyView.test-support";

test("色が見えなくても参照方向・種類・役割・未定義の意味を確認できる", () => {
  const screen = renderContent(<DependencyLegend />);
  const legend = screen.host.querySelector('[aria-label="依存図の凡例"]')!;

  expect(legend.textContent).toContain("参照する宣言 → 参照される宣言");
  expect(legend.textContent).toContain("RECORD: AND");
  expect(legend.textContent).toContain("CHOICE: OR");
  expect(legend.textContent).toContain("ALIAS: 別名");
  expect(legend.textContent).toContain("VALUE: 制約");
  expect(legend.textContent).toContain("WORKFLOW: 入力／出力／エラー");
  expect(legend.textContent).toContain("破線・警告: 未定義");
  screen.unmount();
});
