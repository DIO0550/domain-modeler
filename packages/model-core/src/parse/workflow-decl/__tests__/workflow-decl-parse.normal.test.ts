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
  const chunks = DeclChunk.split(Tokenizer.tokenize(source));
  expect(chunks).toHaveLength(1);
  return WorkflowDeclParse.materialize(chunks[0]!);
};

test("input の AND と output の OR を workflow 宣言へ変換する", () => {
  const result = materialize(`workflow 注文を確定する =
  input: 未検証の注文 AND 在庫状況
  output: 注文確定イベント OR 注文保留イベント`);

  expect(result).toMatchObject({
    declaration: {
      kind: "workflow",
      name: "注文を確定する",
      input: {
        terms: [{ name: "未検証の注文" }, { name: "在庫状況" }],
      },
      output: {
        terms: [{ name: "注文確定イベント" }, { name: "注文保留イベント" }],
      },
      error: { present: false },
    },
    diagnostics: [],
  });
});

test("error 節と後置修飾を workflow 宣言へ変換する", () => {
  const result = materialize(`workflow 通知する =
  input: 通知要求 option
  output: 通知済み
  error: 宛先不明 OR 送信失敗 list`);

  expect(result).toMatchObject({
    declaration: {
      kind: "workflow",
      input: { terms: [{ modifiers: ["option"] }] },
      error: {
        present: true,
        terms: [
          { name: "宛先不明" },
          { name: "送信失敗", modifiers: ["list"] },
        ],
      },
    },
    diagnostics: [],
  });
});
