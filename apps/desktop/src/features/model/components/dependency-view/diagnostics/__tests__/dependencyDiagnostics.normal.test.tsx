import { act } from "react";
import { expect, test } from "vitest";
import type { SourceRange } from "@domain-modeler/model-core";
import { AnalyzedModel } from "../../../../domains/analyzed-model";
import { DependencyDiagnostics } from "..";
import {
  renderContent,
  renderDependency,
} from "../../__tests__/dependencyView.test-support";

test("構文エラーと参照警告の深刻度・行・メッセージを区別して表示する", () => {
  const screen = renderDependency("data =\ndata 注文 = 未定義型\n", {
    children: <DependencyDiagnostics />,
  });
  const buttons = screen.host.querySelectorAll("details button");

  expect(screen.host.querySelector("summary")!.textContent).toBe("診断 2件");
  expect(buttons[0].textContent).toContain("エラー・行 1");
  expect(buttons[1].textContent).toContain("警告・行 2");
  expect(buttons[1].textContent).toContain("未定義型");
  screen.unmount();
});

test("日本語とCRLFを含む本文の診断から正しいソース範囲へ移動する", () => {
  const source = "data 注文 = string\r\ndata 日本語名 = 未定義名 option\r\n";
  const opened: (SourceRange | undefined)[] = [];
  const screen = renderDependency(source, {
    children: <DependencyDiagnostics />,
    onEditSource: (range) => opened.push(range),
  });

  act(() =>
    screen.host.querySelector<HTMLButtonElement>("details button")!.click(),
  );

  expect(opened).toEqual([AnalyzedModel.create(source).diagnostics[0].range]);
  expect(opened[0]?.startLine).toBe(2);
  screen.unmount();
});

test("同じ警告メッセージでも、片方の解消後に残った参照箇所とフォーカスを保つ", () => {
  const opened: (SourceRange | undefined)[] = [];
  const source = "data A = 同じ型\ndata B = 同じ型\n";
  const screen = renderDependency(source, {
    children: <DependencyDiagnostics />,
    onEditSource: (range) => opened.push(range),
  });

  screen.host.querySelectorAll<HTMLButtonElement>("details button")[1].focus();
  screen.render("data A = string\ndata B = 同じ型\n");

  const remaining =
    screen.host.querySelector<HTMLButtonElement>("details button")!;

  expect(document.activeElement).toBe(remaining);

  act(() => remaining.click());

  expect(opened).toEqual([AnalyzedModel.create(source).diagnostics[1].range]);
  screen.unmount();
});

test("診断がなければ空の診断領域を出さない", () => {
  const screen = renderDependency("data 注文 = string", {
    children: <DependencyDiagnostics />,
  });

  expect(screen.host.querySelector("details")).toBeNull();
  screen.unmount();
});

test("Rootの外では他の文書の診断を表示しない", () => {
  const screen = renderContent(<DependencyDiagnostics />);

  expect(screen.host.textContent).toBe("");
  screen.unmount();
});
