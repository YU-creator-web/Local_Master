# Ticket: デプロイ & 本番環境構築 (Cloud Run)

**ID**: T-007-Deployment
**Status**: Pending

## 目標 (Goal)
アプリケーションを Google Cloud Run にデプロイし、一般公開する。

## 要件 (Requirements)
- **Infrastructure**: Cloud Run (Next.js Standalone mode).
- **CI/CD**: GitHub Actions (推奨) または 手動デプロイコマンド。
- **Environment**: 本番用環境変数 (`env.production`) の設定。

## 実装手順 (Implementation Steps)
1. [ ] **Dockerfile 作成**:
    - Next.js の Standalone モードを利用した軽量イメージ。
2. [ ] **Cloud Build / Cloud Run 設定**:
    - `gcloud run deploy` コマンドの整備。
    - サービスアカウント権限設定（Vertex AI 実行権限）。
3. [ ] **環境変数設定**:
    - APIキー、Firebase設定等をCloud Runの環境変数に登録。
4. [ ] **ドメイン確認**:
    - 生成されたURLでのアクセス確認。

## 検証 (Verification)
- 本番URLにアクセスし、エラーなく動作すること。
- モバイル端末から本番URLでスムーズに利用できること。
