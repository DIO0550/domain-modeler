import { NamedDecl, type NamedDecl as NamedDeclValue } from "@domain-modeler/model-core";
import type { AnalyzedModel } from "..";

/**
 * 解析結果から出現順の名前付き宣言を取り出す。
 *
 * @param model 解析済みの文書。
 * @param index 名前付き宣言の出現順。
 * @returns その位置の名前付き宣言。
 */
export const namedDeclAt = (
  model: AnalyzedModel,
  index: number,
): NamedDeclValue => {
  const decl = model.document.declarations.filter(NamedDecl.is)[index];
  if (decl === undefined) {
    throw new Error(`named declaration at ${index} is missing`);
  }
  return decl;
};
