# Ticket: 検索結果のストリーミング表示実装

**ID**: T-010-Streaming
**Status**: ✅ 完了

## 目標 (Goal)
Gemini 3 の応答待ち時間を体感的に短縮するため、AI検索結果をストリーミング（順次表示）できるようにする。

## 要件 (Requirements)
1. **Tech Stack**: Next.js App Router API Streaming (`ReadableStream`).
2. **API Response**: NDJSON (Newline Delimited JSON) 形式等を用いて、イベントごとにデータをクライアントにプッシュする。
    - イベント例: `candidates_found` (候補店名リスト), `shop_details` (スコア計算完了した店舗データ), `complete`.
3. **Frontend**:
    - `fetch` API でストリームを読み込み、順次 State に追加・描画する。
    - ユーザーには「検索中...」のスピナーだけでなく、見つかった店からポコポコと表示される体験を提供する。

## 変更対象ファイル
- `src/app/api/search/route.ts`: 全面改修（Generator関数等を使用）。
- `src/app/search/page.tsx`: データ取得ロジックの変更。
- `src/lib/places.ts`: 必要に応じて非同期処理の調整（基本変更なし）。

## 実装手順 (Implementation Steps)
1. [ ] **API改修 (`src/app/api/search/route.ts`)**:
    - `NextResponse.json()` を廃止し、`new Response(stream)` を返す。
    - `TransformStream` または `AsyncGenerator` を使用して、処理が進むごとにチャンクを書き込む。
    - 候補検索完了 → ストリーム出力。
    - 各店舗のスコアリング完了 → ストリーム出力（並列処理の結果を順次流す）。
2. [ ] **フロントエンド改修 (`src/app/search/page.tsx`)**:
    - `useEffect` 内の `fetch` 処理をストリーム読み込み (`reader.read()`) に変更。
    - 受信したJSONチャンクをパースし、`setShops` でリストに追加していく。
3. [ ] **UI調整**:
    - ストリーミング中のローディング表示（スケルトン表示などではなく、追加アニメーションなど）。

## 検証 (Verification)
- 検索開始後、数秒で最初の1件が表示されること。
- その後、パラパラと残りの店舗が表示されていくこと。
- 最終的に全件（10件程度）が表示され、エラーなく完了すること。
