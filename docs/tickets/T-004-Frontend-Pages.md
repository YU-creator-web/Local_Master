# Ticket: フロントエンド主要画面 (Search, List, Detail)

**ID**: T-004-Frontend-Pages
**Status**: ✅ 完了

## 目標 (Goal)
「検索 → 結果一覧 → 詳細」のメインフローを実装し、3D要素でユーザー体験を高める。

## 要件 (Requirements)
- **Pages**:
    - `/` (Home): 駅名入力 + 3Dパーティクル + 背景スライダー。
    - `/search` (List): 検索結果一覧（レスポンシブグリッド）。
    - `/shop/[id]` (Detail): 店舗詳細 + AI解説 + 地図。
- **UI/UX**: モバイルファースト、直感的な操作。

## 実装手順 (Implementation Steps)
1. [x] **Home Page (`src/app/page.tsx`)**:
    - **ヒーローセクション**: 背景スライダー(5枚) + 金粉3Dパーティクル。
    - 検索ボックス、現在地検索ボタンの実装。
2. [x] **Search Results (`src/app/search/page.tsx`)**:
    - 検索API連携。
    - `ShopCard` グリッド表示（老舗スコア + 創業年を目立たせる）。
3. [x] **Detail Page (`src/app/shop/[id]/page.tsx`)**:
    - 詳細API連携。
    - **レイアウト構成**:
        - 上部: ヒーロー画像。
        - 中央: **AI店主の語り**（老舗の物語）。
        - 下部: Google Maps 表示。
4. [x] **Map Component**:
    - Google Maps Embed API の組み込み。

## 検証 (Verification)
- ホーム画面で背景スライダーと3D要素が軽快に動作するか。
- 検索から詳細ページまでの遷移がスムーズに行えるか。

