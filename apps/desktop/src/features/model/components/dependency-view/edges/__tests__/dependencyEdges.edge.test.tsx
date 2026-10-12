import { expect, test } from "vitest";
import { DependencyEdges } from "..";
import {
  createDependencyLayout,
  renderContent,
} from "../../__tests__/dependencyView.test-support";

test("未定義の矢印を破線用の状態と警告を含む読み上げ名で区別する", () => {
  const { diagram, layout } = createDependencyLayout("data 注文 = 不明な注文");
  const screen = renderContent(
    <DependencyEdges graph={diagram.graph} layout={layout} />,
  );
  const edge = screen.host.querySelector("g")!;

  expect(edge.getAttribute("data-unresolved")).toBe("true");
  expect(edge.getAttribute("aria-label")).toBe(
    "注文 → 不明な注文: 別名（未定義）",
  );
  expect(edge.querySelector("title")!.textContent).toContain("（未定義）");
  screen.unmount();
});

test("プリミティブだけを参照する宣言に矢印を追加しない", () => {
  const { diagram, layout } = createDependencyLayout(
    "data 注文 = string list option",
  );
  const screen = renderContent(
    <DependencyEdges graph={diagram.graph} layout={layout} />,
  );

  expect(screen.host.querySelectorAll("g")).toHaveLength(0);
  screen.unmount();
});
