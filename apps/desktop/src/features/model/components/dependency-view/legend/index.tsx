/**
 * 色を使わずに種類と矢印の意味を確認できる凡例。
 * @returns 参照方向、宣言種別、未定義の線種。
 */
export function DependencyLegend() {
  return (
    <div className="dependency-view__legend" aria-label="依存図の凡例">
      <strong>参照する宣言 → 参照される宣言</strong>
      <span>RECORD: AND</span>
      <span>CHOICE: OR</span>
      <span>ALIAS: 別名</span>
      <span>VALUE: 制約</span>
      <span>WORKFLOW: 入力／出力／エラー</span>
      <span>破線・警告: 未定義</span>
    </div>
  );
}
