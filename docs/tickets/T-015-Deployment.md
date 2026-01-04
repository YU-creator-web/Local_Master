# Ticket: Firebase Hosting デプロイ

**ID**: T-015-Deployment
**Status**: In Progress

## 目標 (Goal)
アプリケーションをFirebase Hosting (Web Frameworks) にデプロイし、本番環境で動作させる。

## タスク (Tasks)
- [ ] **ビルド確認** 🏗️
    - `npm run build` がエラーなく通ることを確認。
- [ ] **Firebase設定** 🔥
    - `firebase.json` の作成・確認 (Web Frameworks設定)。
    - `.firebaserc` の確認。
- [ ] **デプロイ** 🚀
    - `firebase deploy` の実行。
    - 本番URLでの動作確認 (認証、Firestore、API、画像表示)。
- [ ] **環境変数設定** 🔑
    - 本番環境用の環境変数 (API Key等) が正しく設定されているか確認。

## 関連ファイル
- `firebase.json`
- `.firebaserc`
- `next.config.ts`
