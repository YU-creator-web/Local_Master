# Ticket: フロントエンド主要画面 (Search, List, Detail)

**ID**: T-004-Frontend-Pages
**Status**: Pending

## 目標 (Goal)
「検索 → 結果一覧 → 詳細」のメインフローを実装し、3D要素でユーザー体験を高める。

## 要件 (Requirements)
- **Pages**:
    - `/` (Home): 駅名入力 + 3Dヒーロー表現。
    - `/search` (List): 検索結果一覧。
    - `/shop/[id]` (Detail): 店舗詳細 + AI解説 + 地図。
- **UI/UX**: モバイルファースト、直感的な操作。

## 実装手順 (Implementation Steps)
1. [ ] **Home Page (`src/app/page.tsx`)**:
    - **ヒーローセクション**: 3Dオブジェクト（例：揺れる暖簾）を背景またはアクセントに配置し、「暖簾をくぐる」ような体験を演出。
    - 検索ボックス、現在地検索ボタンの実装。
2. [ ] **Search Results (`src/app/search/page.tsx`)**:
    - 検索API連携。
    - `ShopCard` リスト表示（老舗スコアを目立たせる）。
3. [ ] **Detail Page (`src/app/shop/[id]/page.tsx`)**:
    - 詳細API連携。
    - **レイアウト構成**:
        - 上部: 画像カルーセル。
        - 中央: **AI店主の語り**（老舗の物語）。
        - 下部: Google Maps 表示。
4. [ ] **Map Component**:
    - Google Maps JS API の組み込み。

## 検証 (Verification)
- ホーム画面で3D要素が軽快に動作するか（スマホでのパフォーマンス確認）。
- 検索から詳細ページまでの遷移がスムーズに行えるか。
