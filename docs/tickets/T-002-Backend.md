# Ticket: バックエンドロジック (Search & AI)

**ID**: T-002-Backend
**Status**: ✅ 完了

## 目標 (Goal)
Google Places API による検索機能と、Vertex AI による定性的な「老舗判定・解説」機能を実装する。

## 要件 (Requirements)
- **Route Handlers**: `src/app/api/search/route.ts`, `src/app/api/shop/[id]/route.ts`
- **External APIs**: Google Places API (New), Vertex AI (**Gemini 2.5 Pro**)
- **AI Logic**: 定性的な「老舗スコア」と「物語」の生成。

## 実装手順 (Implementation Steps)
1. [x] **Google Places Client (`src/lib/places.ts`)**
    - `searchNearby(lat, lng, radius, type)` の実装。
    - `getPlaceDetails(placeId)` の実装（AI分析用の口コミ・写真情報取得）。
2. [x] **Vertex AI Client (`src/lib/vertex.ts`)**
    - Gemini クライアントのセットアップ。
    - `generateOldShopScore(shopData)` の実装:
        - 入力: 店名、創業年（あれば）、口コミ要約。
        - 出力: JSON { score: number, reasoning: string, short_summary: string, founding_year: string }
        - *Prompt*: 「ナラティブ（物語性）」「地元愛」「昭和の空気感」を評価軸にする。
3. [x] **API Route: Search (`/api/search`)**
    - パラメータ処理: `lat`, `lng`, `station`。
    - Places API 呼び出し。
    - AI駆動型検索（食べログ評価優先）。
4. [x] **API Route: Detail (`/api/shop/[id]`)**
    - 詳細情報取得。
    - Vertex AI (Grounding with Google Search) で「AI店主の解説」を生成。
    - 「歴史」「名物」「雰囲気」を語らせる。

## 検証 (Verification)
- `/api/search?station=鶴見` 等を叩き、JSONレスポンスに「老舗スコア」「AI要約」「創業年」が含まれることを確認。

