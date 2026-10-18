/** 10宣言ごとに、別名4・RECORD2・CHOICE2・制約値1・workflow1と13辺を作る。 */
export function dependencyPerformanceSource(groups: number): string {
  return Array.from({ length: groups }, (_, index) => {
    const suffix = `第${index}組`;

    return `data 注文ID${suffix} = string
data 顧客${suffix} = string
data 商品${suffix} = string
data 数量${suffix} = int constrained 1..100
data 明細${suffix} = 商品${suffix} AND 数量${suffix}
data 注文${suffix} = 注文ID${suffix} AND 顧客${suffix} AND 明細${suffix} list
data 結果${suffix} = 注文${suffix} OR 顧客${suffix}
data 別名${suffix} = 注文ID${suffix} option
data 選択${suffix} = 結果${suffix} OR 別名${suffix}
workflow 確定${suffix} =
  input: 注文${suffix}
  output: 結果${suffix}
  error: 選択${suffix}
`;
  }).join("\n");
}
