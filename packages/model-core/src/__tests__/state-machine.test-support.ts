/** グラフ投影や画面の結合テストでも使用する代表的な .dmodel 文書。 */
export const stateMachineDocument = `data 注文ID = string
workflow 注文を確定する =
  input: 注文ID
  output: 注文ID
state-machine 注文 =
  transition: 待機 -> 完了 on 確定
  transition: 待機 -> 待機 on 再試行
  transition: 確認 -> 完了 on 承認
  initial: 待機
  state: 待機
  state: 確認
  state: 完了 terminal
state-machine 返金 =
  initial: 申請
  state: 申請 terminal`;
