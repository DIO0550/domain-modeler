import { expect, test } from "vitest";
import { Diagnostic, SourceRange } from "@domain-modeler/model-core";
import { AnalyzedModel } from "../../analyzed-model";
import { EditorDiagnostic } from "..";

test("末尾改行があっても最終の空行を保持する", () => {
  const source = "data 注文ID = string\n";
  const views = EditorDiagnostic.lineViews(
    source,
    AnalyzedModel.create(source).diagnostics,
  );

  expect(views.map((view) => view.segments)).toEqual([
    [{ kind: "plain", text: "data 注文ID = string" }],
    [{ kind: "plain", text: "" }],
  ]);
});

test("CRLFでも未定義参照の桁位置で警告セグメントを切る", () => {
  const source = "data 注文 = 未定義型\r\n";
  const views = EditorDiagnostic.lineViews(
    source,
    AnalyzedModel.create(source).diagnostics,
  );

  expect(views[0]?.segments).toEqual([
    { kind: "plain", text: "data 注文 = " },
    { kind: "warning", text: "未定義型" },
  ]);
});

test("CRのみの改行でも未定義参照をその行の桁位置で切る", () => {
  const source = "data 注文ID = string\rdata 注文 = 未定義型";
  const views = EditorDiagnostic.lineViews(
    source,
    AnalyzedModel.create(source).diagnostics,
  );

  expect(views[1]?.segments).toEqual([
    { kind: "plain", text: "data 注文 = " },
    { kind: "warning", text: "未定義型" },
  ]);
});

test("重なる警告範囲は1つの警告セグメントにまとめる", () => {
  const views = EditorDiagnostic.lineViews("abcdefghij", [
    Diagnostic.create("warning", "内側", SourceRange.onLine(1, 3, 6)),
    Diagnostic.create("warning", "外側", SourceRange.onLine(1, 2, 8)),
  ]);

  expect(views[0]?.segments).toEqual([
    { kind: "plain", text: "a" },
    { kind: "warning", text: "bcdefg" },
    { kind: "plain", text: "hij" },
  ]);
  expect(views[0]?.errorMark).toEqual({ kind: "none" });
});

test("空の警告範囲はセグメントを作らない", () => {
  const views = EditorDiagnostic.lineViews("data", [
    Diagnostic.create("warning", "空", SourceRange.onLine(1, 2, 2)),
  ]);

  expect(views[0]?.segments).toEqual([{ kind: "plain", text: "data" }]);
});

test("壊れた宣言の次の正しい行はエラーにしない", () => {
  const source = `data 数量 = int constrained 10..1
data 注文ID = string`;
  const views = EditorDiagnostic.lineViews(
    source,
    AnalyzedModel.create(source).diagnostics,
  );

  expect(views[0]?.errorMark.kind).toBe("error");
  expect(views[1]?.errorMark).toEqual({ kind: "none" });
  expect(views[1]?.segments).toEqual([
    { kind: "plain", text: "data 注文ID = string" },
  ]);
});

test("多数行の末尾にある未定義参照だけを警告セグメントにする", () => {
  const source = `${"data Ok = string\n".repeat(40)}data 注文 = 未定義型`;
  const views = EditorDiagnostic.lineViews(
    source,
    AnalyzedModel.create(source).diagnostics,
  );

  expect(
    views.slice(0, 40).every((view) =>
      view.segments.every((segment) => segment.kind === "plain"),
    ),
  ).toBe(true);
  expect(views[40]?.segments).toEqual([
    { kind: "plain", text: "data 注文 = " },
    { kind: "warning", text: "未定義型" },
  ]);
});
