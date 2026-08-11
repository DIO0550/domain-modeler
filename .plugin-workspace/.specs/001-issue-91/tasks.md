# Task: エラー回復パーサー
## Research & Planning
- ■ 既存回復処理とErrorDecl契約を確認
- ■ ErrorDecl維持をユーザー確認
## Implementation（回帰テスト追加）
- ■ 複数不正宣言と正常宣言の混在テストを追加
- ■ 末尾不正宣言のテストを追加
- ■ 専用テストを実行
## Verification
- ■ 全テスト、型、lint、format、buildを検証
- ■ プロダクションコードに差分がないことを確認
