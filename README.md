# HIS Mobile Daily Usage Collector

HISモバイルの会員画面から電話番号ごとの当月利用データ量を取得し、Googleスプレッドシートへ日次記録するスクリプトです。  
実行基盤は GitHub Actions を前提にしています。

## 1. 事前準備

1. Google Cloud でサービスアカウントを作成し、JSONキーを取得する
2. 記録先スプレッドシートを作成し、サービスアカウントの `client_email` を編集者として共有する
3. このリポジトリを GitHub に push する
4. リポジトリ `Settings > Secrets and variables > Actions` に以下を登録する

- `HIS_MOBILE_ID`
- `HIS_MOBILE_PASSWORD`
- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON` (JSON全文を1行で登録)

## 2. シート仕様

ワークフローは `raw_usage` シートに以下ヘッダで保存します。

- `date_jst`
- `phone`
- `usage_mb`
- `period_start`
- `period_end`
- `plan_name`
- `fetched_at_jst`
- `status`
- `error_message`

同一キー (`date_jst + phone`) は上書き更新されます。

## 3. GitHub Actions

ワークフロー定義: `.github/workflows/daily-his-usage.yml`

- 毎日 JST 06:00 実行 (`cron: 0 21 * * *` UTC)
- `workflow_dispatch` で手動実行可能
- 失敗通知は GitHub Actions ログで確認

## 4. ローカル実行 (任意)

```bash
npm install
npx playwright install chromium
npm run start
```

`.env.example` を参考に環境変数を設定してください。

## 5. 注意点

- HISモバイル画面のHTML構造変更でセレクタ調整が必要になる場合があります
- ログインにCAPTCHA/2段階認証が要求される場合、完全自動化は不安定になります
- 利用規約の範囲で使用してください
