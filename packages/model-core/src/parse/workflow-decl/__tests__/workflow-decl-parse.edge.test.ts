import { expect, test } from "vitest";
import { Tokenizer } from "../../../tokenizer";
import { DeclChunk } from "../../decl-chunk";
import { WorkflowDeclParse } from "..";

/**
 * workflow ソースを単一宣言として解析する。
 * @param source workflow 宣言のソース。
 * @returns 宣言と診断。
 */
const materialize = (source: string) => {
  const chunk = DeclChunk.split(Tokenizer.tokenize(source))[0]!;
  return WorkflowDeclParse.materialize(chunk);
};

test("input 節が欠けると ErrorDecl と診断を返す", () => {
  expect(
    materialize(`workflow 確定する =
  output: 確定イベント`),
  ).toMatchObject({
    declaration: { kind: "error" },
    diagnostics: [{ message: "input: が必要です" }],
  });
});

test("output 節が欠けると ErrorDecl と診断を返す", () => {
  expect(
    materialize(`workflow 確定する =
  input: 注文`),
  ).toMatchObject({
    declaration: { kind: "error" },
    diagnostics: [{ message: "output: が必要です" }],
  });
});

test("input 節で OR を使うと ErrorDecl と診断を返す", () => {
  expect(
    materialize(`workflow 確定する =
  input: 注文 OR 在庫
  output: 確定イベント`),
  ).toMatchObject({
    declaration: { kind: "error" },
    diagnostics: [{ message: "input: では OR を使用できません" }],
  });
});

test("output 節で AND を使うと ErrorDecl と診断を返す", () => {
  expect(
    materialize(`workflow 確定する =
  input: 注文
  output: 確定イベント AND 通知イベント`),
  ).toMatchObject({
    declaration: { kind: "error" },
    diagnostics: [{ message: "output: では AND を使用できません" }],
  });
});

test("error 節より前に output 節が無いと行順序違反になる", () => {
  expect(
    materialize(`workflow 確定する =
  input: 注文
  error: 検証エラー`),
  ).toMatchObject({
    declaration: { kind: "error" },
    diagnostics: [{ message: "output: が必要です" }],
  });
});
