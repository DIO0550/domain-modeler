import { expect, test } from "vitest";
import { Diagnostic, SourceRange } from "@domain-modeler/model-core";
import { AnalyzedModel } from "../../analyzed-model";
import { EditorDiagnostic } from "..";

test("正しい行はエラー背景も警告下線も無い", () => {
  const source = "data 注文ID = string";
  expect(
    EditorDiagnostic.lineViews(source, AnalyzedModel.create(source).diagnostics),
  ).toEqual([
    {
      line: 1,
      segments: [{ kind: "plain", text: source }],
      errorMark: { kind: "none" },
    },
  ]);
});

test("パースエラーの行は行末メッセージ付きのエラーになる", () => {
  const source = "data 数量 = int constrained 10..1";
  const views = EditorDiagnostic.lineViews(
    source,
    AnalyzedModel.create(source).diagnostics,
  );

  expect(views).toEqual([
    {
      line: 1,
      segments: [{ kind: "plain", text: source }],
      errorMark: {
        kind: "error",
        messages: ["範囲の下限が上限を超えています"],
      },
    },
  ]);
});

test("未定義参照は警告セグメントになりエラーにはしない", () => {
  const source = "data 注文 = 未定義型";
  const views = EditorDiagnostic.lineViews(
    source,
    AnalyzedModel.create(source).diagnostics,
  );

  expect(views).toEqual([
    {
      line: 1,
      segments: [
        { kind: "plain", text: "data 注文 = " },
        { kind: "warning", text: "未定義型" },
      ],
      errorMark: { kind: "none" },
    },
  ]);
});

test("空文書は1行の空表示になる", () => {
  expect(EditorDiagnostic.lineViews("", [])).toEqual([
    {
      line: 1,
      segments: [{ kind: "plain", text: "" }],
      errorMark: { kind: "none" },
    },
  ]);
});

test("複数行エラーは全行をエラーにしメッセージは開始行だけに付ける", () => {
  const range = {
    startLine: 1,
    startColumn: 1,
    endLine: 2,
    endColumn: 4,
  };
  const views = EditorDiagnostic.lineViews(
    "data 数量 = int constrained 10..1\nゴミ行",
    [Diagnostic.create("error", "範囲の下限が上限を超えています", range)],
  );

  expect(views.map((view) => view.errorMark)).toEqual([
    { kind: "error", messages: ["範囲の下限が上限を超えています"] },
    { kind: "error", messages: [] },
  ]);
});

test("同じ行の複数エラーは出現順のメッセージを集める", () => {
  const range = SourceRange.onLine(1, 1, 5);
  const views = EditorDiagnostic.lineViews("data", [
    Diagnostic.create("error", "宣言の形が不正です", range),
    Diagnostic.create("error", "識別子が必要です", range),
  ]);

  expect(views[0]?.errorMark).toEqual({
    kind: "error",
    messages: ["宣言の形が不正です", "識別子が必要です"],
  });
});

test("パースエラーは読み上げ用の説明文と無効状態になる", () => {
  const source = "data 数量 = int constrained 10..1";
  expect(
    EditorDiagnostic.accessibleSummary(
      AnalyzedModel.create(source).diagnostics,
    ),
  ).toEqual({
    invalid: true,
    description: "範囲の下限が上限を超えています",
  });
});

test("未定義参照は読み上げ用の説明文になり無効状態にはしない", () => {
  const source = "data 注文 = 未定義型";
  expect(
    EditorDiagnostic.accessibleSummary(
      AnalyzedModel.create(source).diagnostics,
    ),
  ).toEqual({
    invalid: false,
    description: "「未定義型」は未定義です",
  });
});

test("診断が無い文書は読み上げ用の説明文を空にする", () => {
  expect(EditorDiagnostic.accessibleSummary([])).toEqual({
    invalid: false,
    description: "",
  });
});
