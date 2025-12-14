# Ticket: 初期セットアップ (Initial Project Setup)

**ID**: T-001-Setup
**Status**: ✅ 完了

## 目標 (Goal)
Next.js 16 (App Router) と Tailwind CSS 4.x を導入し、「老舗Master」の基盤を構築する。

## 要件 (Requirements)
- **Framework**: Next.js 16.x (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x (CSS-first configuration)
- **Folder Structure**: `src/app`, `src/components`, `src/lib`, `src/types`
- **Linting/Formatting**: Prettier, ESLint

## 実装手順 (Implementation Steps)
1. [x] **プロジェクト初期化**: `npx create-next-app@latest . --typescript --eslint --tailwind --src-dir --app --import-alias "@/*"`
   - ※ Tailwind 4 がデフォルトでない場合はアップグレードを実施。
2. [x] **Tailwind CSS 4.x 設定**:
   - `global.css` に `@theme` を記述し、テーマカラー（焦げ茶、オレンジ、和紙の白）を定義。
   - インストール: `npm install tailwindcss@next @tailwindcss/postcss@next` (必要に応じて)
3. [x] **不要ファイルの削除**: 初期状態で不要なスタイルやファイルをクリーンアップ。
4. [x] **ディレクトリ構成の作成**:
    - `src/components/ui` (共通UI)
    - `src/lib/firebase` (Firebase設定用)
    - `src/lib/vertex` (AIクライアント用)
5. [x] **動作確認**: ローカルサーバ (`npm run dev`) で起動確認。

## 検証 (Verification)
- `http://localhost:3000` にアクセスし、設定したテーマカラー（背景色など）が反映されていることを確認する。

