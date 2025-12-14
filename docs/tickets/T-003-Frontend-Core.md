# Ticket: フロントエンド共通基盤 & 3D (Frontend Core)

**ID**: T-003-Frontend-Core
**Status**: ✅ 完了

## 目標 (Goal)
Tailwind CSS 4.x による「老舗」デザインシステムの構築と、AntiGravityらしい3D要素（R3F）の導入。

## 要件 (Requirements)
- **Design Theme**:
    - Colors: 焦げ茶 (`#1a0f0a`), Gold (`#D4AF37`), 和紙ホワイト (`#FAFAFA`).
    - Font: Shippori Mincho (Google Fonts).
    - Atmosphere: "Modern Retro", "Warm", "Clean".
- **3D Tech Stack**: `React Three Fiber` (`@react-three/fiber`), `Drei`.
- **Components (`src/components/ui`)**:
    - `Button`, `Input`, `Card`, `Badge` (Tailwind実装)
    - **`GoldParticles` (3D)**: 金粉パーティクル。

## 実装手順 (Implementation Steps)
1. [x] **デザインシステムの定義**:
    - CSS `@theme` でフォント・カラー変数を設定。
    - `Shippori Mincho` フォントの導入。
2. [x] **3D環境のセットアップ**:
    - `npm install three @types/three @react-three/fiber @react-three/drei`
    - `src/components/canvas/Scene.tsx` のようなベースコンポーネント作成。
3. [x] **UIコンポーネント実装**:
    - 基本的なボタン、入力フォーム、カードを作成。
    - 3D金粉パーティクルの実装。
4. [x] **レイアウト (`src/app/layout.tsx`)**:
    - グローバルフォント適用。
    - ヘッダー・フッター配置。

## 検証 (Verification)
- Storybookまたはテストページで、ボタン等のUIがデザイン通りか確認。
- 3Dキャンバスがエラーなく描画され、金粉パーティクルが表示されることを確認。

