# Ticket: 詳細ページ改修 (食べログ・喫煙情報・マップ)

**ID**: T-012-Detail-Improvements
**Status**: ✅ 完了

## 目標 (Goal)
詳細ページ (`/shop/[id]`) の UI を刷新し、ユーザーが求める重要情報（食べログリンク、喫煙可否、マップ）を追加する。
AIの語り口調を標準的なものに調整し、見やすさを向上させる。

## 要件 (Requirements)
1.  **AIプロンプト修正 (`src/lib/vertex.ts`)**:
    *   `generateShopGuide` の出力に `tabelog_url` (食べログURL) と `smoking_status` (喫煙/禁煙情報) を追加。
    *   AIのキャラクター設定（口調）を少し落とし、標準的で読みやすい説明にする。
2.  **型定義修正 (`src/lib/vertex.ts`)**:
    *   `ShopGuideResult` 型の拡張。
3.  **UI改修 (`src/app/shop/[id]/page.tsx`)**:
    *   全体のトーンを Dark/Gold/Glassmorphism に統一。
    *   「食べログで見る」ボタンの追加 (Must)。
    *   喫煙情報の表示 (Must)。
    *   Google Map の表示 (下部)。
    *   その他、営業時間や電話番号など Places API から取れる情報の表示（おまかせ）。

## 変更対象ファイル
- `src/lib/vertex.ts`: プロンプトと型定義。
- `src/app/shop/[id]/page.tsx`: UI実装。

## 実装手順 (Implementation Steps)
1. [ ] **AIロジック改修**:
    - `vertex.ts` の `generateShopGuide` プロンプトを更新し、Web Grounding で `tabelog_url` と `smoking_status` を探させる。
2. [ ] **フロントエンド改修**:
    - `page.tsx` を全面的にリファクタリング。
    - アイコン付きのスペック表（喫煙、営業時間、電話番号）を追加。
    - マップコンポーネントのスタイル調整。

## 検証 (Verification)
- 詳細ページを開き、AI生成テキストに「食べログURL」が含まれているか確認。
- 喫煙情報が正しく表示されるか（Web情報の確度によるが、AIが探してくるか確認）。
- マップが表示され、操作可能であること。
