import { expect, test } from "vitest";
import { DependencyEdges } from "..";
import {
  createDependencyLayout,
  renderContent,
} from "../../__tests__/dependencyView.test-support";

test.each([
  { source: "data A = B\ndata B = string", label: "別名" },
  { source: "data A = B AND int\ndata B = string", label: "構成要素" },
  { source: "data A = B OR int\ndata B = string", label: "選択肢" },
])("dataの参照の役割を文字と読み上げ名で区別する: $label", ({
  source,
  label,
}) => {
  const { diagram, layout } = createDependencyLayout(source);
  const screen = renderContent(
    <DependencyEdges graph={diagram.graph} layout={layout} />,
  );
  const edge = screen.host.querySelector("g")!;

  expect(edge.getAttribute("aria-label")).toBe(`A → B: ${label}`);
  expect(edge.querySelector("text")!.textContent).toBe(label);
  screen.unmount();
});

test("同じ対象へのworkflowの各役割を1本の矢印へ集約し、入力も参照先へ向ける", () => {
  const { diagram, layout } = createDependencyLayout(
    "data 注文 = string\nworkflow 処理 =\n  input: 注文 AND 注文\n  output: 注文\n  error: 注文\n",
  );
  const screen = renderContent(
    <DependencyEdges graph={diagram.graph} layout={layout} />,
  );
  const edge = screen.host.querySelector("g")!;
  const from = layout.nodes.find(
    (node) => node.id === edge.getAttribute("data-from"),
  )!;
  const to = layout.nodes.find(
    (node) => node.id === edge.getAttribute("data-to"),
  )!;

  expect(screen.host.querySelectorAll("g")).toHaveLength(1);
  expect(edge.getAttribute("aria-label")).toBe(
    "処理 → 注文: 入力・出力・エラー",
  );
  expect(
    [...edge.querySelectorAll("tspan")].map((span) => span.textContent),
  ).toEqual(["入力", "出力", "エラー"]);
  expect(edge.querySelector("path")!.getAttribute("d")).toMatch(
    new RegExp(`^M ${from.x + from.width} ${from.y + from.height / 2} L `),
  );
  expect(edge.querySelector("path")!.getAttribute("d")).toContain(
    `L ${to.x} ${to.y + to.height / 2}`,
  );
  screen.unmount();
});

test("同時に描画した別の図の矢印マーカーを参照しない", () => {
  const { diagram, layout } = createDependencyLayout(
    "data A = B\ndata B = string",
  );
  const screen = renderContent(
    <>
      <DependencyEdges graph={diagram.graph} layout={layout} />
      <DependencyEdges graph={diagram.graph} layout={layout} />
    </>,
  );
  const diagrams = screen.host.querySelectorAll("svg");
  const first = diagrams[0].querySelector("marker")!.id;
  const second = diagrams[1].querySelector("marker")!.id;

  expect(first).not.toBe(second);
  expect(diagrams[0].querySelector("g path")!.getAttribute("marker-end")).toBe(
    `url(#${first})`,
  );
  expect(diagrams[1].querySelector("g path")!.getAttribute("marker-end")).toBe(
    `url(#${second})`,
  );
  screen.unmount();
});
