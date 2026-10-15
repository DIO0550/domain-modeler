import { AnalyzedModel } from "../../analyzed-model";
import { DependencyDiagram } from "../../dependency-diagram";
import { DependencySelection } from "..";

/** 仕様書の受入用サンプル。 */
export const orderSource = `data 注文ID = string
data 顧客情報 = string
data 商品ID = string
data 数量 = int constrained 1..100
data 注文明細 = 商品ID AND 数量
data 注文 = 注文ID AND 顧客情報 AND 注文明細 list
data 注文確定 = 注文ID
data 検証エラー = string

workflow 注文を確定する =
  input: 注文
  output: 注文確定
  error: 検証エラー
`;

/** 実DSLから選択と表示範囲を作る。 */
export function selectModel(source: string, name: string) {
  const diagram = DependencyDiagram.create(AnalyzedModel.create(source));
  const node = diagram.graph.nodes.find((item) => item.name === name)!;
  const selection = DependencySelection.reduce(
    DependencySelection.create(diagram),
    {
      type: "select",
      id: node.id,
    },
  );

  return { diagram, selection, node };
}
