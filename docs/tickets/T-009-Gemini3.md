# Ticket: Gemini 3 導入 & Web Grounding 実装

**ID**: T-009-Gemini3
**Status**: ✅ 完了

## 目標 (Goal)
AIモデルを最新の `gemini-3-pro-preview` にアップグレードし、`@google/genai` SDK を使用して Web Grounding（リアルタイム検索）を安定稼働させる。

## 背景 (Context)
- 現在の `gemini-2.5-pro` (`@google-cloud/vertexai`) は将来的に非推奨となる。
- `gemini-3-pro-preview` は `location: global` で動作する。
- ユーザーは最新情報（「今日のニュース」等）に基づく回答を求めている。

## 要件 (Requirements)
1. **SDK移行**: `@google-cloud/vertexai` -> `@google/genai`
2. **モデル変更**: `gemini-3-pro-preview`
3. **Location変更**: `us-central1` -> `global`
4. **Web Grounding**: `googleSearch` ツールを適切に設定し、検索クエリが発行されていることを確認する。

## 変更対象ファイル
- `src/lib/vertex.ts`: 全面リファクタリング

## 実装手順 (Implementation Steps)
1. [ ] **パッケージ確認**: `@google/genai` が `package.json` にあるか確認（なければインストール）。
2. [ ] **`src/lib/vertex.ts` リファクタリング**:
    - `GoogleGenAI` クラスを使用。
    - `generateOldShopScore`: Grounding有効化。
    - `generateShopGuide`: Grounding有効化。
    - `findShiniseCandidates`: Grounding有効化（最新の店探し）。
3. [ ] **動作確認**:
    - ローカルで検索実行 -> ログに検索クエリが出るか確認。
    - 詳細ページ -> AI店主の語りが最新情報を反映しているか確認。

## 検証 (Verification)
- テストファイル `test/gemini3-grounding-test.ts` が通ること。
- アプリ上で「老舗スコア」生成時にエラーが出ないこと。
